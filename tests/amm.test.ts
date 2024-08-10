import { expect } from 'chai'
import { AMM } from '../src/contracts/amm' // Adjust the path according to your setup
import { ERC20, BalanceMap, AllowanceMap } from '../src/contracts/erc20' // Adjust the path according to your setup
import {
    PubKey,
    Sig,
    HashedMap,
    Addr,
    toByteString,
    pubKey2Addr,
} from 'scrypt-ts'

type Allowance = {
    owner: Addr
    spender: Addr
}

describe('AMM Contract Tests', () => {
    let amm: AMM
    let token: ERC20
    let lpToken: ERC20
    let lpTokenBalances: HashedMap<Addr, bigint>
    let allowances: AllowanceMap
    let balances: BalanceMap

    beforeEach(() => {
        const poolPubkey = PubKey(toByteString('00'.repeat(32))) // Use PubKey as a function

        balances = new HashedMap<Addr, bigint>()
        allowances = new HashedMap<Allowance, bigint>()

        token = new ERC20(
            toByteString('MyToken'),
            toByteString('MTK'),
            poolPubkey,
            balances,
            allowances
        )

        lpToken = new ERC20(
            toByteString('MyLPToken'),
            toByteString('MLP'),
            poolPubkey,
            balances,
            allowances
        )

        lpTokenBalances = new HashedMap<Addr, bigint>()
        amm = new AMM(poolPubkey, token, lpToken, lpTokenBalances, 0n)
    })

    it('should add liquidity and mint LP tokens', () => {
        const sender = PubKey(toByteString('01'.repeat(32))) // Use PubKey as a function
        const senderSig = Sig(toByteString('02'.repeat(32))) // Use Sig as a function
        const tokenAmount = 1000n
        const senderBalance = 5000n
        const oldTokenBalance = 500n
        const lpSenderBalance = 0n
        const newBitcoinBalance = 100n

        amm.addLiquidity(
            sender,
            senderSig,
            tokenAmount,
            senderBalance,
            oldTokenBalance,
            lpSenderBalance,
            newBitcoinBalance
        )

        expect(lpTokenBalances.get(pubKey2Addr(sender))).to.equal(
            newBitcoinBalance
        )
        expect(amm.lpTokenSupply).to.equal(newBitcoinBalance)
    })

    it('should remove liquidity and burn LP tokens', () => {
        const sender = PubKey(toByteString('01'.repeat(32))) // Use PubKey as a function
        const senderSig = Sig(toByteString('02'.repeat(32))) // Use Sig as a function
        const lpAmount = 100n
        const oldTokenBalance = 500n
        const senderBalance = 5000n

        // Simulate adding liquidity first
        amm.addLiquidity(
            sender,
            senderSig,
            1000n,
            senderBalance,
            oldTokenBalance,
            0n,
            100n
        )

        amm.removeLiquidity(
            sender,
            senderSig,
            lpAmount,
            oldTokenBalance,
            senderBalance
        )

        expect(lpTokenBalances.get(pubKey2Addr(sender))).to.equal(0n)
        expect(amm.lpTokenSupply).to.equal(0n)
    })

    // it('should swap tokens for Bitcoin', () => {
    //     const sender = PubKey(toByteString('01'.repeat(32))); // Use PubKey as a function
    //     const senderSig = Sig(toByteString('02'.repeat(32))); // Use Sig as a function
    //     const tokenAmount = 500n;
    //     const senderBalance = 1000n;
    //     const oldTokenBalance = 1000n;
    //     const txPreimage = toByteString('03'.repeat(32)); // Placeholder txPreimage

    //     // Simulate adding liquidity first
    //     amm.addLiquidity(sender, senderSig, 1000n, senderBalance, oldTokenBalance, 0n, 100n);

    //     amm.swapTokenToBitcoin(sender, tokenAmount, senderSig, senderBalance, 0n, oldTokenBalance, 0n, txPreimage);

    //     // Check state changes
    //     expect(/* check relevant state variables */);
    // });

    // it('should swap Bitcoin for tokens', () => {
    //     const sender = PubKey(toByteString('01'.repeat(32))); // Use PubKey as a function
    //     const senderSig = Sig(toByteString('02'.repeat(32))); // Use Sig as a function
    //     const tokenAmount = 500n;
    //     const senderBalance = 1000n;
    //     const oldTokenBalance = 1000n;
    //     const newBitcoinBalance = 200n;

    //     // Simulate adding liquidity first
    //     amm.addLiquidity(sender, senderSig, 1000n, senderBalance, oldTokenBalance, 0n, 100n);

    //     amm.swapBitcoinToToken(sender, tokenAmount, senderSig, oldTokenBalance, senderBalance, newBitcoinBalance);

    //     // Check state changes
    //     expect(/* check relevant state variables */);
    // });

    it('should mint LP tokens correctly', () => {
        const owner = PubKey(toByteString('01'.repeat(32))) // Use PubKey as a function
        const ownerBalance = 0n
        const amount = 100n

        amm.mintLPToken(owner, ownerBalance, amount)

        expect(lpTokenBalances.get(pubKey2Addr(owner))).to.equal(amount)
        expect(amm.lpTokenSupply).to.equal(amount)
    })

    it('should burn LP tokens correctly', () => {
        const owner = PubKey(toByteString('01'.repeat(32))) // Use PubKey as a function
        const ownerBalance = 100n
        const amount = 50n

        amm.mintLPToken(owner, 0n, ownerBalance) // Mint LP tokens first

        amm.burnLPToken(pubKey2Addr(owner), amount)

        expect(lpTokenBalances.get(pubKey2Addr(owner))).to.equal(
            ownerBalance - amount
        )
        expect(amm.lpTokenSupply).to.equal(ownerBalance - amount)
    })
})
