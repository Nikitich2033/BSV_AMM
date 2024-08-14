import { AMM } from './src/contracts/amm_w_lib'
import { ERC20Lib } from './src/contracts/erc20lib'
import {
    bsv,
    TestWallet,
    DefaultProvider,
    PubKey,
    HashedMap,
    toByteString,
    Addr,
} from 'scrypt-ts'

import * as dotenv from 'dotenv'

// Load the .env file
dotenv.config()

if (!process.env.PRIVATE_KEY) {
    throw new Error(
        'No "PRIVATE_KEY" found in .env, Please run "npm run genprivkey" to generate a private key'
    )
}

// Read the private key from the .env file.
const privateKey = bsv.PrivateKey.fromWIF(process.env.PRIVATE_KEY || '')

// Prepare signer.
const signer = new TestWallet(
    privateKey,
    new DefaultProvider({
        network: bsv.Networks.testnet,
    })
)

async function main() {
    await AMM.loadArtifact()

    // Adjust the amount of satoshis locked in the smart contract:
    const amount = 1000 // Example amount, adjust as needed.

    // Prepare parameters for the AMM constructor
    const poolPubkey = PubKey(toByteString('03'.repeat(32))) // Example pubkey
    const token = new ERC20Lib(
        toByteString('04'.repeat(32)), // Name
        toByteString('04'.repeat(32)), // Symbol
        poolPubkey, // Issuer's pubkey
        new HashedMap(), // Balances
        new HashedMap() // Allowances
    )
    const lpToken = new ERC20Lib(
        toByteString('05'.repeat(32)), // Name
        toByteString('05'.repeat(32)), // Symbol
        poolPubkey, // Issuer's pubkey
        new HashedMap(), // Balances
        new HashedMap() // Allowances
    )
    const lpTokenBalances = new HashedMap<Addr, bigint>()

    const instance = new AMM(
        poolPubkey,
        token,
        lpToken,
        lpTokenBalances,
        0n // Initial LP token supply
    )

    // Connect to a signer.
    await instance.connect(signer)

    // Contract deployment.
    const deployTx = await instance.deploy(amount)
    console.log(`AMM contract deployed: ${deployTx.id}`)
}

main().catch(console.error)
