// import { expect } from 'chai';
// import { AMM } from '../src/contracts/amm_w_lib';
// import { ERC20Lib, ERC20Pair } from '../src/contracts/erc20lib';
// import {
//     PubKey,
//     Sig,
//     HashedMap,
//     Addr,
//     toByteString,
//     pubKey2Addr,
// } from 'scrypt-ts';

// describe('AMM Contract Tests', () => {
//     let amm: AMM;
//     let token: ERC20Lib;
//     let lpToken: ERC20Lib;
//     let lpTokenBalances: HashedMap<Addr, bigint>;

//     before(async () => {
//         await AMM.compile();
//     });

//     beforeEach(() => {
//         const poolPubkey = PubKey(toByteString('00'.repeat(32)));
//         token = new ERC20Lib(
//             toByteString('MyToken'),
//             toByteString('MTK'),
//             poolPubkey,
//             new HashedMap<Addr, bigint>(),
//             new HashedMap<Addr, bigint>()
//         );

//         lpToken = new ERC20Lib(
//             toByteString('MyLPToken'),
//             toByteString('MLP'),
//             poolPubkey,
//             new HashedMap<Addr, bigint>(),
//             new HashedMap<Addr, bigint>()
//         );

//         lpTokenBalances = new HashedMap<Addr, bigint>();
//         amm = new AMM(poolPubkey, token, lpToken, lpTokenBalances, 0n);
//     });

//     it('should add liquidity and mint LP tokens', () => {
//         const sender = PubKey(toByteString('01'.repeat(32)));
//         const senderSig = Sig(toByteString('02'.repeat(32)));
//         const tokenAmount = 1000n;
//         const senderBalance = 5000n;
//         const oldTokenBalance = 500n;
//         const lpSenderBalance = 0n;
//         const newBitcoinBalance = 100n;

//         amm.addLiquidity(
//             sender,
//             senderSig,
//             tokenAmount,
//             senderBalance,
//             oldTokenBalance,
//             lpSenderBalance,
//             newBitcoinBalance
//         );

//         expect(lpTokenBalances.get(pubKey2Addr(sender))).to.equal(newBitcoinBalance);
//         expect(amm.lpTokenSupply).to.equal(newBitcoinBalance);
//     });

//     it('should remove liquidity and burn LP tokens', () => {
//         const sender = PubKey(toByteString('01'.repeat(32)));
//         const senderSig = Sig(toByteString('02'.repeat(32)));
//         const lpAmount = 100n;
//         const oldTokenBalance = 500n;
//         const senderBalance = 5000n;

//         amm.addLiquidity(
//             sender,
//             senderSig,
//             1000n,
//             senderBalance,
//             oldTokenBalance,
//             0n,
//             100n
//         );

//         amm.removeLiquidity(
//             sender,
//             senderSig,
//             lpAmount,
//             oldTokenBalance,
//             senderBalance
//         );

//         expect(lpTokenBalances.get(pubKey2Addr(sender))).to.equal(0n);
//         expect(amm.lpTokenSupply).to.equal(0n);
//     });

//     it('should mint LP tokens correctly', () => {
//         const owner = PubKey(toByteString('01'.repeat(32)));
//         const ownerBalance = 0n;
//         const amount = 100n;

//         amm.mintLPToken(owner, ownerBalance, amount);

//         expect(lpTokenBalances.get(pubKey2Addr(owner))).to.equal(amount);
//         expect(amm.lpTokenSupply).to.equal(amount);
//     });

//     it('should burn LP tokens correctly', () => {
//         const owner = PubKey(toByteString('01'.repeat(32)));
//         const ownerBalance = 100n;
//         const amount = 50n;

//         amm.mintLPToken(owner, 0n, ownerBalance);

//         amm.burnLPToken(pubKey2Addr(owner), amount);

//         expect(lpTokenBalances.get(pubKey2Addr(owner))).to.equal(ownerBalance - amount);
//         expect(amm.lpTokenSupply).to.equal(ownerBalance - amount);
//     });
// });
