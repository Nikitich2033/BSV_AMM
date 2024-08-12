// import {
//     method,
//     SigHash,
//     prop,
//     SmartContract,
//     assert,
//     Addr,
//     PubKey,
//     Sig,
//     pubKey2Addr,
//     hash256,
//     HashedMap,
//     // ByteString,
// } from 'scrypt-ts'
// import { ERC20, ERC20Pair } from './erc20'

// export class AMM extends SmartContract {
//     @prop()
//     poolPubkey: PubKey

//     @prop(true)
//     token: ERC20

//     @prop(true)
//     lpToken: ERC20

//     @prop(true)
//     lpTokenBalances: HashedMap<Addr, bigint>

//     @prop(true)
//     lpTokenSupply: bigint

//     constructor(
//         poolPubkey: PubKey,
//         token: ERC20,
//         lpToken: ERC20,
//         lpTokenBalances: HashedMap<Addr, bigint>,
//         lpTokenSupply: bigint
//     ) {
//         super(poolPubkey, token, lpToken, lpTokenBalances, lpTokenSupply);
//         this.poolPubkey = poolPubkey;
//         this.token = token;
//         this.lpToken = lpToken;
//         this.lpTokenBalances = lpTokenBalances;
//         this.lpTokenSupply = lpTokenSupply;
//     }

//     @method(SigHash.SINGLE)
//     public addLiquidity(
//         sender: PubKey,
//         senderSig: Sig,
//         tokenAmount: bigint,
//         senderBalance: bigint,
//         oldTokenBalance: bigint,
//         lpSenderBalance: bigint,
//         newBitcoinBalance: bigint
//     ) {
//         assert(this.checkSig(senderSig, sender), 'Invalid signature')

//         const oldBitcoinBalance = this.ctx.utxo.value

//         if (oldBitcoinBalance === 0n) {
//             const lpMint = newBitcoinBalance
//             this.mintLPToken(sender, lpSenderBalance, lpMint)
//         } else {
//             const bitcoinAmount = newBitcoinBalance - oldBitcoinBalance
//             assert(
//                 oldBitcoinBalance * tokenAmount ===
//                     bitcoinAmount * oldTokenBalance,
//                 'Deposit ratio mismatch'
//             )

//             const lpMint =
//                 (this.lpTokenSupply * bitcoinAmount) / oldBitcoinBalance
//             this.mintLPToken(sender, lpSenderBalance, lpMint)
//         }

//         const from = {
//             address: pubKey2Addr(sender),
//             balance: senderBalance,
//         } as ERC20Pair
//         const to = {
//             address: pubKey2Addr(this.poolPubkey),
//             balance: oldTokenBalance,
//         } as ERC20Pair

//         this.token.transferFrom(
//             sender,
//             senderSig,
//             tokenAmount,
//             from,
//             to,
//             tokenAmount
//         )

//         assert(
//             this.ctx.hashOutputs ===
//                 hash256(this.buildStateOutput(newBitcoinBalance)),
//             'State propagation failed'
//         )
//     }

//     @method(SigHash.SINGLE)
//     public removeLiquidity(
//         sender: PubKey,
//         senderSig: Sig,
//         lpAmount: bigint,
//         oldTokenBalance: bigint,
//         senderBalance: bigint
//     ) {
//         assert(this.checkSig(senderSig, sender), 'Invalid signature')

//         const oldBitcoinBalance = this.ctx.utxo.value

//         const bitcoinAmount =
//             (oldBitcoinBalance * lpAmount) / this.lpTokenSupply
//         const tokenAmount = (oldTokenBalance * lpAmount) / this.lpTokenSupply

//         this.burnLPToken(pubKey2Addr(sender), lpAmount)

//         const from = {
//             address: pubKey2Addr(this.poolPubkey),
//             balance: oldTokenBalance,
//         } as ERC20Pair
//         const to = {
//             address: pubKey2Addr(sender),
//             balance: senderBalance,
//         } as ERC20Pair

//         this.token.transferFrom(
//             sender,
//             senderSig,
//             tokenAmount,
//             from,
//             to,
//             tokenAmount
//         )

//         assert(
//             this.ctx.hashOutputs ===
//                 hash256(
//                     this.buildStateOutput(this.ctx.utxo.value - bitcoinAmount)
//                 ),
//             'State propagation failed'
//         )
//     }

//     @method(SigHash.SINGLE)
//     public swapTokenToBitcoin(
//         sender: PubKey,
//         tokenAmount: bigint,
//         senderSig: Sig,
//         senderBalance: bigint,
//         senderKeyIndex: bigint,
//         oldTokenBalance: bigint
//         // lpSenderBalance: bigint,
//         // txPreimage: ByteString
//     ) {
//         assert(this.checkSig(senderSig, sender), 'Invalid signature')

//         const oldBitcoinBalance: bigint = this.ctx.utxo.value

//         // Calculate bitcoins in return using the constant product formula directly here.
//         const bitcoinsAmount: bigint =
//             (oldBitcoinBalance * tokenAmount) / oldTokenBalance

//         // Ensure the amount is valid.
//         assert(bitcoinsAmount > 0n, 'Invalid bitcoin amount calculated.')

//         const newBitcoinBalance: bigint = oldBitcoinBalance - bitcoinsAmount

//         const from = {
//             address: pubKey2Addr(sender),
//             balance: senderBalance,
//         } as ERC20Pair
//         const to = {
//             address: pubKey2Addr(this.poolPubkey),
//             balance: oldTokenBalance,
//         } as ERC20Pair

//         // Ensure you pass all necessary parameters to transferFrom, including the amount.
//         this.token.transferFrom(
//             sender,
//             senderSig,
//             tokenAmount,
//             from,
//             to,
//             tokenAmount
//         )

//         // Propagate state with the updated Bitcoin balance
//         assert(
//             this.ctx.hashOutputs ===
//                 hash256(this.buildStateOutput(newBitcoinBalance)),
//             'State propagation failed'
//         )
//     }

//     @method(SigHash.SINGLE)
//     public swapBitcoinToToken(
//         sender: PubKey,
//         tokenAmount: bigint,
//         senderSig: Sig,
//         oldTokenBalance: bigint,
//         senderBalance: bigint,
//         newBitcoinBalance: bigint
//     ) {
//         assert(this.checkSig(senderSig, sender), 'Invalid signature')

//         const oldBitcoinBalance = this.ctx.utxo.value
//         const bitcoinAmount = newBitcoinBalance - oldBitcoinBalance

//         // Calculate tokens in return using the constant product formula directly here.
//         const tokensAmount: bigint =
//             (bitcoinAmount * oldTokenBalance) / oldBitcoinBalance

//         const from = {
//             address: pubKey2Addr(this.poolPubkey),
//             balance: oldTokenBalance,
//         } as ERC20Pair
//         const to = {
//             address: pubKey2Addr(sender),
//             balance: senderBalance,
//         } as ERC20Pair

//         this.token.transferFrom(
//             sender,
//             senderSig,
//             tokensAmount,
//             from,
//             to,
//             tokensAmount
//         )

//         assert(
//             this.ctx.hashOutputs ===
//                 hash256(this.buildStateOutput(newBitcoinBalance)),
//             'State propagation failed'
//         )
//     }

//     @method(SigHash.SINGLE)
//     public mintLPToken(owner: PubKey, ownerBalance: bigint, amount: bigint) {
//         const ownerAddr = pubKey2Addr(owner)
//         const newBalance = ownerBalance + amount
//         this.lpTokenBalances.set(ownerAddr, newBalance)
//         this.lpTokenSupply += amount

//         assert(
//             this.ctx.hashOutputs ===
//                 hash256(this.buildStateOutput(this.ctx.utxo.value)),
//             'Mint operation failed'
//         )
//     }

//     @method(SigHash.SINGLE)
//     public burnLPToken(owner: Addr, amount: bigint) {
//         const currentBalance = 0n
//         let burnSuccess = false

//         if (this.lpTokenBalances.canGet(owner, currentBalance)) {
//             assert(currentBalance >= amount, 'Burn amount exceeds balance')
//             const newBalance = currentBalance - amount
//             this.lpTokenBalances.set(owner, newBalance)
//             this.lpTokenSupply -= amount

//             burnSuccess = true
//         }

//         // Final assertion to comply with the need to end with an assert()
//         assert(burnSuccess, 'Burn operation failed')
//     }

//     @method(SigHash.SINGLE)
//     public getAmount(
//         input: bigint,
//         inputReserve: bigint,
//         outputReserve: bigint
//     ) {
//         // Calculate the output amount based on the constant product formula.
//         const amount: bigint = (outputReserve * input) / inputReserve

//         // Assert that the output amount is valid.
//         assert(amount > 0n, 'Output amount must be greater than 0')

//         // Instead of returning, assert that this value matches expected conditions or
//         // can be used in subsequent calculations.
//         assert(amount <= outputReserve, 'Amount exceeds available reserves')
//     }
// }
