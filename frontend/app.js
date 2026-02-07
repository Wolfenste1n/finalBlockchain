let provider, signer, tokenContract;
let isInitialized = false;

function saveConnectionState(account, tokenAddress) {
  localStorage.setItem('web3_connected', 'true');
  localStorage.setItem('web3_account', account);
  localStorage.setItem('web3_tokenAddress', tokenAddress);
  localStorage.setItem('web3_lastConnect', Date.now().toString());
}

function clearConnectionState() {
  localStorage.removeItem('web3_connected');
  localStorage.removeItem('web3_account');
  localStorage.removeItem('web3_tokenAddress');
  localStorage.removeItem('web3_lastConnect');
}

function getConnectionState() {
  return {
    isConnected: localStorage.getItem('web3_connected') === 'true',
    account: localStorage.getItem('web3_account'),
    tokenAddress: localStorage.getItem('web3_tokenAddress'),
    lastConnect: localStorage.getItem('web3_lastConnect')
  };
}

async function restoreConnectionIfNeeded() {
  const state = getConnectionState();
  
  if (state.isConnected && window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        const currentAccount = accounts[0].toLowerCase();
        const savedAccount = state.account?.toLowerCase();
        
        if (currentAccount === savedAccount) {
          await quickConnect();
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to restore connection:', err);
    }
  }
  
  return false;
}

async function quickConnect() {
  if (!window.ethereum) return false;
  
  const state = getConnectionState();
  if (!state.isConnected || !state.tokenAddress) return false;
  
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    if (accounts.length === 0) {
      clearConnectionState();
      return false;
    }
    
    signer = await provider.getSigner();
    const currentAccount = await signer.getAddress();
    
    if (currentAccount.toLowerCase() !== state.account?.toLowerCase()) {
      clearConnectionState();
      return false;
    }
    
    const abiResp = await fetch('../MyToken-ABI.json');
    const abi = await abiResp.json();
    
    tokenContract = new ethers.Contract(state.tokenAddress, abi, signer);
    
    updateUI();
    
    return true;
    
  } catch (err) {
    console.error('Quick connect failed:', err);
    return false;
  }
}

function updateUI() {
  if (!signer || !tokenContract) return;
  
  const addrEl = document.getElementById('address');
  if (addrEl) {
    signer.getAddress().then(account => {
      addrEl.textContent = account;
    });
  }
  
  updateBalance();
}

async function updateBalance() {
  try {
    if (!tokenContract || !signer) return;
    
    const account = await signer.getAddress();
    const raw = await tokenContract.balanceOf(account);
    const decimals = await tokenContract.decimals();
    let human = ethers.formatUnits(raw, decimals);
    
    human = parseFloat(human).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    const balEl = document.getElementById('cft-balance');
    if (balEl) balEl.textContent = `${human} CFT`;
    
  } catch (err) {
    console.error('Balance error:', err);
  }
}

window.updateBalance = updateBalance;

window.connect = async function connect() {
  try {
    if (!window.ethereum) {
      alert('Install MetaMask');
      return;
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    if (accounts.length === 0) return;
    
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    const network = await provider.getNetwork();
    if (Number(network.chainId) !== 31337) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x7A69' }]
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7A69',
              chainName: 'Hardhat Local',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['http://127.0.0.1:8545']
            }]
          });
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      location.reload();
      return;
    }

    const account = await signer.getAddress();
    
    const tokenAddr = window.APP_CONFIG && window.APP_CONFIG.tokenAddress;
    if (tokenAddr) {
      saveConnectionState(account, tokenAddr);
    }

    const addrEl = document.getElementById('address');
    if (addrEl) addrEl.textContent = account;

    const abiResp = await fetch('../MyToken-ABI.json');
    const abi = await abiResp.json();

    if (!tokenAddr) {
      alert('Set tokenAddress in config.js');
      return;
    }

    tokenContract = new ethers.Contract(tokenAddr, abi, signer);

    try {
      await tokenContract.decimals();
      await tokenContract.symbol();
      
      await updateBalance();
    } catch {
      alert('Contract test failed. Check ABI.');
      return;
    }

    setupEventListeners();
    isInitialized = true;

  } catch (err) {
    console.error(err);
    alert('Connect failed: ' + err.message);
  }
}

function setupEventListeners() {
  if (!window.ethereum) return;
  
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) {
      clearConnectionState();
      location.reload();
    } else {
      setTimeout(() => {
        updateUI();
      }, 100);
    }
  });
  
  window.ethereum.on('chainChanged', () => {
    location.reload();
  });
}

function attachBuyButtons() {
  const buttons = document.querySelectorAll('.btn-buy');
  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!tokenContract || !signer) {
        const restored = await restoreConnectionIfNeeded();
        if (!restored) {
          const shouldConnect = confirm('Please connect MetaMask first. Connect now?');
          if (shouldConnect) {
            await connect();
          }
          return;
        }
      }
      
      const price = btn.getAttribute('data-price');
      const name = btn.getAttribute('data-name') || 'Item';
      await buy(name, price);
    });
  });
}

function attachBlockchainButton() {
  const blockchainBtn = document.querySelector('button[onclick="checkBlockchainBalance()"]');
  if (blockchainBtn) {
    blockchainBtn.addEventListener('click', async () => {
      await window.checkBlockchainBalance();
    });
  }
}

window.buy = async function buy(name, price) {
  try {
    if (!tokenContract) {
      alert('Connect first');
      return;
    }

    const shopAddr = window.APP_CONFIG && window.APP_CONFIG.shopAddress;
    if (!shopAddr) {
      alert('Set shopAddress in config.js');
      return;
    }

    const account = await signer.getAddress();
    const balance = await tokenContract.balanceOf(account);
    const decimals = await tokenContract.decimals();
    const amount = ethers.parseUnits(String(price), decimals);
    
    if (balance < amount) {
      alert(`Insufficient balance. You have ${ethers.formatUnits(balance, decimals)} CFT`);
      return;
    }

    const tx = await tokenContract.transfer(shopAddr, amount);
    
    const receipt = await tx.wait();
    
    await updateBalance();
    
    alert(`Purchased ${name} for ${price} CFT\nTx: ${receipt.transactionHash}`);
    
  } catch (err) {
    console.error('Buy error:', err);
    
    if (err.code === 'ACTION_REJECTED') {
      alert('Transaction was rejected');
    } else if (err.message.includes('user rejected')) {
      alert('You rejected the transaction');
    } else {
      alert('Purchase failed: ' + err.message);
    }
  }
}

async function initPage() {
  attachBuyButtons();
  attachBlockchainButton();
  
  const restored = await restoreConnectionIfNeeded();
  
  if (restored) {
    console.log('Connection restored');
  }
  
  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn) {
    connectBtn.disabled = false;
  }
  
  isInitialized = true;
}

window.refreshBalance = async function() {
  try {
    await updateBalance();
    alert('Balance refreshed');
  } catch (err) {
    console.error('Refresh error:', err);
  }
}

window.disconnect = function() {
  clearConnectionState();
  provider = null;
  signer = null;
  tokenContract = null;
  
  const addrEl = document.getElementById('address');
  if (addrEl) addrEl.textContent = 'Not connected';
  
  const balEl = document.getElementById('cft-balance');
  if (balEl) balEl.textContent = '0 CFT';
  
  alert('Disconnected successfully');
};

window.checkBlockchainBalance = async function() {
  try {
    if (!tokenContract || !signer) {
      alert('Connect first');
      return;
    }

    const account = await signer.getAddress();
    const shopAddr = window.APP_CONFIG && window.APP_CONFIG.shopAddress;
    
    if (!shopAddr) {
      alert('Shop address not set');
      return;
    }

    const yourBalance = await tokenContract.balanceOf(account);
    const shopBalance = await tokenContract.balanceOf(shopAddr);
    const decimals = await tokenContract.decimals();
    
    console.log('Blockchain balance check:');
    console.log('Account:', account);
    console.log('Shop address:', shopAddr);
    console.log('Your balance:', ethers.formatUnits(yourBalance, decimals), 'CFT');
    console.log('Shop balance:', ethers.formatUnits(shopBalance, decimals), 'CFT');
    
    try {
      const filter = tokenContract.filters.Transfer(account, shopAddr);
      const events = await tokenContract.queryFilter(filter);
      console.log('Transfers to shop:', events.length);
      
      if (events.length > 0) {
        events.forEach((event, i) => {
          console.log(`Transfer ${i + 1}:`, {
            amount: ethers.formatUnits(event.args.value, decimals) + ' CFT',
            txHash: event.transactionHash,
            block: event.blockNumber
          });
        });
      }
    } catch (filterErr) {
      console.log('Could not get transfer events:', filterErr.message);
    }
    
  } catch (err) {
    console.error('Balance check failed:', err);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPage);
} else {
  initPage();
}

window.addEventListener('storage', function(event) {
  if (event.key === 'web3_account' || event.key === 'web3_connected') {
    console.log('Storage updated');
    if (!isInitialized) {
      setTimeout(() => {
        restoreConnectionIfNeeded();
      }, 100);
    }
  }
});