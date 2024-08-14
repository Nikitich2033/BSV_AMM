import {
    method,
    SigHash,
    prop,
    SmartContract,
    assert,
    Addr,
    PubKey,
    Sig,
    pubKey2Addr,
    hash256,
    HashedMap,
} from 'scrypt-ts'
import { ERC20Lib, ERC20Pair } from './erc20lib'

export class AMM extends SmartContract {
    @prop()
    poolPubkey: PubKey

    @prop(true)
    token: ERC20Lib

    @prop(true)
    lpToken: ERC20Lib

    @prop(true)
    lpTokenBalances: HashedMap<Addr, bigint>

    @prop(true)
    lpTokenSupply: bigint

    constructor(
        poolPubkey: PubKey,
        token: ERC20Lib,
        lpToken: ERC20Lib,
        lpTokenBalances: HashedMap<Addr, bigint>,
        lpTokenSupply: bigint
    ) {
        super(poolPubkey, token, lpToken, lpTokenBalances, lpTokenSupply)
        this.poolPubkey = poolPubkey
        this.token = token
        this.lpToken = lpToken
        this.lpTokenBalances = lpTokenBalances
        this.lpTokenSupply = lpTokenSupply
    }

    @method(SigHash.SINGLE)
    public addLiquidity(
        sender: PubKey,
        senderSig: Sig,
        tokenAmount: bigint,
        senderBalance: bigint,
        oldTokenBalance: bigint,
        lpSenderBalance: bigint,
        newBitcoinBalance: bigint
    ) {
        assert(this.checkSig(senderSig, sender), 'Invalid signature')

        const oldBitcoinBalance = this.ctx.utxo.value

        if (oldBitcoinBalance === 0n) {
            const lpMint = newBitcoinBalance
            this.lpToken.mint(pubKey2Addr(sender), lpMint)
        } else {
            const bitcoinAmount = newBitcoinBalance - oldBitcoinBalance
            assert(
                oldBitcoinBalance * tokenAmount ===
                    bitcoinAmount * oldTokenBalance,
                'Deposit ratio mismatch'
            )

            const lpMint =
                (this.lpTokenSupply * bitcoinAmount) / oldBitcoinBalance
            this.lpToken.mint(pubKey2Addr(sender), lpMint)
        }

        const from = {
            address: pubKey2Addr(sender),
            balance: senderBalance,
        } as ERC20Pair
        const to = {
            address: pubKey2Addr(this.poolPubkey),
            balance: oldTokenBalance,
        } as ERC20Pair

        this.token.transferFrom(senderBalance, from, to, tokenAmount)

        assert(
            this.ctx.hashOutputs ===
                hash256(this.buildStateOutput(newBitcoinBalance)),
            'State propagation failed'
        )
    }

    @method(SigHash.SINGLE)
    public removeLiquidity(
        sender: PubKey,
        senderSig: Sig,
        lpAmount: bigint,
        oldTokenBalance: bigint,
        senderBalance: bigint
    ) {
        assert(this.checkSig(senderSig, sender), 'Invalid signature')

        const oldBitcoinBalance = this.ctx.utxo.value

        const bitcoinAmount =
            (oldBitcoinBalance * lpAmount) / this.lpTokenSupply
        const tokenAmount = (oldTokenBalance * lpAmount) / this.lpTokenSupply

        this.lpToken.burn(pubKey2Addr(sender), lpAmount)

        const from = {
            address: pubKey2Addr(this.poolPubkey),
            balance: oldTokenBalance,
        } as ERC20Pair
        const to = {
            address: pubKey2Addr(sender),
            balance: senderBalance,
        } as ERC20Pair

        this.token.transferFrom(senderBalance, from, to, tokenAmount)

        assert(
            this.ctx.hashOutputs ===
                hash256(
                    this.buildStateOutput(this.ctx.utxo.value - bitcoinAmount)
                ),
            'State propagation failed'
        )
    }

    @method(SigHash.SINGLE)
    public swapTokenToBitcoin(
        sender: PubKey,
        tokenAmount: bigint,
        senderSig: Sig,
        senderBalance: bigint,
        senderKeyIndex: bigint,
        oldTokenBalance: bigint
    ) {
        assert(this.checkSig(senderSig, sender), 'Invalid signature')

        const oldBitcoinBalance: bigint = this.ctx.utxo.value

        //constant product formula implementation
        const bitcoinsAmount: bigint =
            (oldBitcoinBalance * tokenAmount) / (oldTokenBalance + tokenAmount)

        assert(bitcoinsAmount > 0n, 'Invalid bitcoin amount calculated.')

        const newBitcoinBalance: bigint = oldBitcoinBalance - bitcoinsAmount

        const from = {
            address: pubKey2Addr(sender),
            balance: senderBalance,
        } as ERC20Pair
        const to = {
            address: pubKey2Addr(this.poolPubkey),
            balance: oldTokenBalance,
        } as ERC20Pair

        this.token.transferFrom(senderBalance, from, to, tokenAmount)

        assert(
            this.ctx.hashOutputs ===
                hash256(this.buildStateOutput(newBitcoinBalance)),
            'State propagation failed'
        )
    }

    @method(SigHash.SINGLE)
    public swapBitcoinToToken(
        sender: PubKey,
        bitcoinAmount: bigint,
        senderSig: Sig,
        oldTokenBalance: bigint,
        senderBalance: bigint,
        newBitcoinBalance: bigint
    ) {
        assert(this.checkSig(senderSig, sender), 'Invalid signature')

        const oldBitcoinBalance = this.ctx.utxo.value
        const bitcoinInputAmount = newBitcoinBalance - oldBitcoinBalance

        //constant product formula implementation
        const tokensAmount: bigint =
            (bitcoinInputAmount * oldTokenBalance) /
            (oldBitcoinBalance + bitcoinInputAmount)

        const from = {
            address: pubKey2Addr(this.poolPubkey),
            balance: oldTokenBalance,
        } as ERC20Pair
        const to = {
            address: pubKey2Addr(sender),
            balance: senderBalance,
        } as ERC20Pair

        this.token.transferFrom(senderBalance, from, to, tokensAmount)

        assert(
            this.ctx.hashOutputs ===
                hash256(this.buildStateOutput(newBitcoinBalance)),
            'State propagation failed'
        )
    }

    @method(SigHash.SINGLE)
    public mintLPToken(owner: PubKey, ownerBalance: bigint, amount: bigint) {
        this.lpToken.mint(pubKey2Addr(owner), amount)

        const ownerAddr = pubKey2Addr(owner)
        this.lpTokenBalances.set(ownerAddr, ownerBalance + amount)
        this.lpTokenSupply += amount

        assert(
            this.ctx.hashOutputs ===
                hash256(this.buildStateOutput(this.ctx.utxo.value)),
            'Mint operation failed'
        )
    }

    @method(SigHash.SINGLE)
    public burnLPToken(owner: Addr, amount: bigint) {
        this.lpToken.burn(owner, amount)

        const currentBalance = 0n
        let burnSuccess = false

        if (this.lpTokenBalances.canGet(owner, currentBalance)) {
            assert(currentBalance >= amount, 'Burn amount exceeds balance')
            const newBalance = currentBalance - amount
            this.lpTokenBalances.set(owner, newBalance)
            this.lpTokenSupply -= amount

            burnSuccess = true
        }

        assert(burnSuccess, 'Burn operation failed')
    }

    @method(SigHash.SINGLE)
    public getAmount(
        input: bigint,
        inputReserve: bigint,
        outputReserve: bigint
    ) {
        //constant product formula implementation
        const amount: bigint = (outputReserve * input) / (inputReserve + input)
        assert(amount > 0n, 'Output amount must be greater than 0')
        assert(amount <= outputReserve, 'Amount exceeds available reserves')
    }
}
