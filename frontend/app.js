let provider, signer, tokenContract;

window.switchToLocalNetwork = async function() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x7A69' }]
    });
  } catch (switchError) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x7A69',
            chainName: 'Hardhat Local',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['http://127.0.0.1:8545'],
            blockExplorerUrls: []
          }]
        });
      } catch (addError) {
        console.error('Failed to add network:', addError);
      }
    }
  }
}

window.connect = async function connect() {
  try {
    if (!window.ethereum) {
      alert('Install MetaMask');
      return;
    }

    await switchToLocalNetwork();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    const network = await provider.getNetwork();
    console.log('Network ID:', Number(network.chainId));
    
    if (Number(network.chainId) !== 31337) {
      alert('Still on wrong network. Please switch manually to localhost.');
      return;
    }

    const account = await signer.getAddress();
    const addrEl = document.getElementById('address');
    if (addrEl) addrEl.textContent = account;

    const abiResp = await fetch('../MyToken-ABI.json');
    const abi = await abiResp.json();

    const tokenAddr = window.APP_CONFIG && window.APP_CONFIG.tokenAddress;
    if (!tokenAddr) {
      alert('Set tokenAddress in config.js');
      return;
    }

    const code = await provider.getCode(tokenAddr);
    if (code === '0x') {
      const defaultAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
      const defaultCode = await provider.getCode(defaultAddress);
      
      if (defaultCode !== '0x') {
        alert(`Contract found at default address: ${defaultAddress}\nUpdate your config.js`);
        return;
      }
      
      alert('No contract found. Make sure:\n1. Hardhat node is running\n2. Contract is deployed');
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

    window.ethereum.on && window.ethereum.on('accountsChanged', updateBalance);
    window.ethereum.on && window.ethereum.on('chainChanged', () => location.reload());

  } catch (err) {
    console.error(err);
    alert('Connect failed: ' + err.message);
  }
}

async function updateBalance() {
  try {
    if (!tokenContract || !signer) return;
    
    const account = await signer.getAddress();
    const raw = await tokenContract.balanceOf(account);
    const decimals = await tokenContract.decimals();
    const human = ethers.formatUnits(raw, decimals);
    
    const balEl = document.getElementById('cft-balance');
    if (balEl) balEl.textContent = `${human} CFT`;
    
  } catch (err) {
    console.error('Balance error:', err);
    
    if (err.code === 'BAD_DATA' && err.data === '0x') {
      await tryDirectCall();
    }
  }
}

async function tryDirectCall() {
  try {
    const account = await signer.getAddress();
    const tokenAddr = tokenContract.target;
    
    const balanceOfInterface = new ethers.Interface([
      "function balanceOf(address) view returns (uint256)"
    ]);
    
    const data = balanceOfInterface.encodeFunctionData("balanceOf", [account]);
    const result = await provider.call({ to: tokenAddr, data: data });
    
    if (result === '0x') {
      console.error('Direct call failed');
      return;
    }
    
    const decoded = balanceOfInterface.decodeFunctionResult("balanceOf", result);
    const balance = decoded[0];
    const decimals = await tokenContract.decimals();
    const human = ethers.formatUnits(balance, decimals);
    
    const balEl = document.getElementById('cft-balance');
    if (balEl) balEl.textContent = `${human} CFT`;
    
  } catch (altErr) {
    console.error('Direct call failed:', altErr);
  }
}

window.updateBalance = updateBalance;

function attachBuyButtons() {
  const buttons = document.querySelectorAll('.btn-buy');
  buttons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const price = btn.getAttribute('data-price');
      const name = btn.getAttribute('data-name') || 'Item';
      await buy(name, price);
    });
  });
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

    const decimals = await tokenContract.decimals();
    const amount = ethers.parseUnits(String(price), decimals);

    const tx = await tokenContract.transfer(shopAddr, amount);
    const receipt = await tx.wait();
    alert(`Purchased ${name} for ${price} CFT\nTx: ${receipt.transactionHash}`);
    await updateBalance();
  } catch (err) {
    console.error('Buy error:', err);
    alert('Purchase failed: ' + err.message);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachBuyButtons);
} else {
  attachBuyButtons();
}