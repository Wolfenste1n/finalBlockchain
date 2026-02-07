//ethers v6
let provider, signer, tokenContract;

window.connect = async function connect() {
  try {
    if (!window.ethereum) {
      alert('MetaMask not detected. Install MetaMask and try again.');
      return;
    }

    await window.ethereum.request({ method: 'eth_requestAccounts' });
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    const account = await signer.getAddress();
    const addrEl = document.getElementById('address');
    if (addrEl) addrEl.textContent = account;

    const abiResp = await fetch('../MyToken-ABI.json');
    const abi = await abiResp.json();

    const tokenAddr = window.APP_CONFIG && window.APP_CONFIG.tokenAddress;
    if (!tokenAddr) {
      console.warn('tokenAddress not set in frontend/config.js');
    } else {
      tokenContract = new ethers.Contract(tokenAddr, abi, signer);
      await updateBalance();
    }

    window.ethereum.on && window.ethereum.on('accountsChanged', () => updateBalance());
    window.ethereum.on && window.ethereum.on('chainChanged', () => window.location.reload());

  } catch (err) {
    console.error(err);
    alert('Failed to connect: ' + (err.message || err));
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
    console.error('updateBalance error', err);
  }
}

window.updateBalance = updateBalance;

function attachBuyButtons() {
  const buttons = document.querySelectorAll('.btn-buy');
  buttons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const price = btn.getAttribute('data-price');
      const name = btn.getAttribute('data-name') || 'Item';
      await buy(name, price);
    });
  });
}

window.buy = async function buy(name, price) {
  try {
    if (!tokenContract) {
      alert('Connect MetaMask and set tokenAddress in frontend/config.js first.');
      return;
    }

    const shopAddr = window.APP_CONFIG && window.APP_CONFIG.shopAddress;
    if (!shopAddr) {
      alert('Please set `shopAddress` in frontend/config.js');
      return;
    }

    const decimals = await tokenContract.decimals();
    const amount = ethers.parseUnits(String(price), decimals);

    const tx = await tokenContract.transfer(shopAddr, amount);
    const receipt = await tx.wait();
    alert(`Purchased ${name} for ${price} CFT\nTx: ${receipt.transactionHash}`);
    await updateBalance();
  } catch (err) {
    console.error('buy error', err);
    alert('Purchase failed: ' + (err.message || err));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachBuyButtons);
} else {
  attachBuyButtons();
}
