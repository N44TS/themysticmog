import { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import myEpicNft from './utils/MyEpicNFT.json';
import spinner from "./assets/dountspinner.gif";


// Constants
const CONTRACT_ADDRESS = "0x497c96734d7d74704eaCc8D2C7A7FB4609bf46c4";
//const OS_FULL_COLLECTION = 'https://testnets.opensea.io/collection/mysticmogsnfts';
const OS_FULL_COLLECTION = 'https://testnets.opensea.io/collection/themysticmog';
//const RARIBLETOKENHOLDER = 'https://rinkeby.rarible.com/token/0x5d3a5E37b7d05057cCD334CED69d01EdA874d423:0?tab=details';
const TOTAL_MINT_COUNT = 100;

function App() {
//variable to set the users account in state
const [currentAccount, setCurrentAccount] = useState("");
//text box variable
const [messageValue, setMessageValue] = useState("");
//loading spinner
const [loading, setLoading] = useState(false);
//how many nfts minted so far
const [nftCount, setNftCount] = useState(""); 
// to see the token ID from event
const [tokenId, setTokenID] = useState(["0"]);
//setting random words to make combined
const [hasFortune, setHasFortune] = useState("");

const OPENSEAACCT = `https://testnets.opensea.io/${currentAccount}`
  
  //WALLET STUFF
  //CHECKING IF ITS THERE
 const checkIfWalletIsConnected = async () => {
  const { ethereum } = window;
   
    if (!ethereum) {
      console.log("Make sure you have metamask!");
    } else {
      console.log("We have the ethereum object", ethereum);
    }
//Check if we're authorized to access the user's wallet
      const accounts = await ethereum.request({ method: "eth_accounts" });
//User can have multiple authorized accounts, we grab the first one if its there!
      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        
      } else {
          console.log("No authorized account found")
      }
  };

  //CONNECT WALLET IMPLIMENTATION
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("You got to have metamask to get involved -> https://metamask.io/");
        return;
      }

    //checking and then changing the network if not on Rinkby - REMEBER TO UPDATE WHEN NETWORK CHANGED
    const chainId = await ethereum.request({ method: 'eth_chainId' });    
    console.log("Current network", chainId);
    //check which network the wallet is connected on 
    if(chainId != 5){
      alert("Woah Mystic Mog uses Goerli! You need to switch network if you want to get your fortune");
    };
     // request to switch the network to rinkeby if not on it
     const tx = await ethereum.request({method: 'wallet_switchEthereumChain', params:[{chainId: 
      '0x5'}]}).catch()
      if (tx) {
        console.log(tx)
      }
      
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      
    } catch (error) {
      console.log(error)
    }
  };

      // SET UP MAIN EVENT/EMIT LISTENER
   // usual connection stuff
    const setupEventListener = async () => {
        // Most of this looks the same as our function askContractToMintNft
        try {
            const { ethereum } = window;
            if (ethereum) {
                const provider = new ethers.providers.Web3Provider(ethereum);
                const signer = provider.getSigner();
                const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft, signer);
        // BUT THIS BITS NEW 
        // "capture" our event when our contract throws it. Event being that nft has been actually minted
                connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
                    console.log(from, tokenId.toNumber());
                    setTokenID(tokenId.toNumber())
                    alert(
                        `Woop Woop! We've minted your Fortune NFT and sent it to your wallet. It may be blank right now. It can take a while to show up.`
                    );
                });

                console.log("Setup event listener!");
            } else {
                console.log("Ethereum object doesn't exist!");
            }
        } catch (error) {
            console.log(error);
        }
    };


  // FUNCTION TIME
  //minting!
  const askContractToMintNft = async () => {
  try {
    const { ethereum } = window;
    if (ethereum) {
      
    //checking AGAIN and then changing the network if not on Rinkby - REMEBER TO UPDATE WHEN NETWORK CHANGED
    const chainId = await ethereum.request({ method: 'eth_chainId' });    
    console.log("Current network", chainId);
    //check which network the wallet is connected on 
    if(chainId != 5){
      alert("Mystic Mog uses Goerli, please switch network to start minting");
    };
     // request to switch the network to rinkeby if not on it
     const tx = await ethereum.request({method: 'wallet_switchEthereumChain', params:[{chainId: 
      '0x5'}]}).catch()
      if (tx) {
        console.log(tx)
      }
         //now get on with the minting
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft, signer);

      console.log("Going to pop wallet now to pay gas...")
      setLoading(true)
      let nftTxn = await connectedContract.makeAnEpicNFT(messageValue);

      console.log("Mining...please wait.")
      await nftTxn.wait();
      
      console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
      setupEventListener();
      setLoading(false)
    } else {
      console.log("Ethereum object doesn't exist!");
    }
  } catch (error) {
    console.log(error)
    setLoading(false)
  }
};

//SHOW NFT WORDS
const Fortune = async () => {
    try {
     const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft, signer);
      console.log("Lets get fortune");
      //Gets total poloys minted from the smart contract
     const first = await connectedContract.pickRandomFirstWord(tokenId);
     const second = await connectedContract.pickRandomSecondWord(tokenId);
     const third = await connectedContract.pickRandomThirdWord(tokenId);
      console.log("Talking to the catnip gods done");
      let combinedword = (first.toString() + second.toString() + third.toString());
      //updates the state
     setHasFortune(combinedword);
    console.log(hasFortune)
   }
   catch(error){console.log('if this is befroe minting then fine, if after then waaaa theres somin wrong', error)}
 }

  Fortune();

  //HOW MANY NFTS MINTED SO FAR??
  const getNftCount = async () => {
      try {
        const provider = ethers.getDefaultProvider("goerli");
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft, provider);

        let number = await connectedContract.getTotalNFTsMinted();

        setNftCount(number.toString());
        console.log("got nft count")
      }
       catch(error){
     console.log('UseEffect to get NFTCOUNT calling rinkeby', error)}
    }

  
  // This runs our function when the page loads.
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  useEffect(() => {
    getNftCount();
  })
  
  
  // BUTTON RENDER FOR CONNECT WALLET
  const buttonConnect = () => (
    <button onClick={connectWallet} className="mintbutton">
      Connect with Metamask (Rinkeby)
    </button>
  );
  
  // BUTTON RENDER FOR MINT NFT
  const buttonMint = () => (
    <button onClick={askContractToMintNft} className="mintbutton">
      Mint NFT
    </button>
  );


  ////////////////////
  //////RETURN///////
  //////////////////
  return (
    <main>
<div id="desktop">

<div className="acctbox">{currentAccount ?  <p style={{"float" : "right", "padding" : "10px"}}> Connected account: {currentAccount.slice(0, 6)}..{currentAccount.slice(-4)}</p> : null }</div>

  <div>
    {currentAccount ? <p style={{"padding" : "5px"}} className="rarible-box"><a href={OPENSEAACCT} target="_blank" rel="noreferrer">View your NFTs</a></p> : null }
  <p style={{"padding" : "5px"}} className="rarible-box"><a href={OS_FULL_COLLECTION} target="_blank" rel="noreferrer">View full Fortune collection</a></p>
  </div>
  
  {/* COLUMN left 
<div className="column left">*/}
  <div className="container">
<h2 className="headertext">The Mystic Mog</h2>
<h1>Mint a unique fortune-teller NFT</h1>
  
<p>Connect with metamask, enter your name (or alias/dogs name/whatever), and discover your fortune!</p>
<div style={{"margin" : "40px", "padding" : "10px" }} className="minty">

  {/*if not loading spinner and not just minted so no fortune then show text box otherwise nothing*/}
{ !loading && !hasFortune ? (<div><input type="text" maxLength ="10" placeholder="Enter your name/alias" onChange={e => setMessageValue(e.target.value)}></input></div>) : null }

  {loading ?(<img style={{"height" : "120px", "width" : "120px"}} src={spinner} />) : null  }

  {/*if had just minted show the fortune*/}
  {hasFortune ? (<div><h3>.....🌙.....</h3><p className="glowtext">{messageValue}{hasFortune}</p> ✨<a className="openlink" href={`https://testnets.opensea.io/assets/goerli/0x497c96734d7d74704eaCc8D2C7A7FB4609bf46c4/${tokenId}`} target="_blank" rel="noreferrer">VIEW YOUR NFT ON OPENSEA HERE</a>✨</div>) : null  }
  
  {/*if not loading spinner show fortunes told and mint button*/}
{ !loading && !hasFortune ? (<div><h3>TOTAL FORTUNES TOLD: {nftCount} / {TOTAL_MINT_COUNT}</h3>
 {currentAccount === "" ? buttonConnect() : buttonMint()}</div>)
 : null }

  {/*if loading spinner dont show anything else*/}
  {loading ? (<h3>Minting please wait (it can take a bit)....</h3>) : null  }
</div>

</div>
{/*</div> this div ends column 1*/}

{/* COLUMN right 
<div className="column right">
     <a href={OPENSEAACCT} target="_blank" rel="noreferrer">Wallet Connected</a>
  </div> */}{/* this div ends column 3 and thus ENDDING THE COLUMNS */}
  
   </div>      {/*  CLOSING DIV FOR DESKTOP DO NOT REMOVE */}
      
    </main>
  );
}

export default App;