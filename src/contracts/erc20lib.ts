import {
    toByteString,
    assert,
    ByteString,
    SmartContractLib,
    prop,
    method,
    Addr,
    HashedMap,
    PubKey,
    pubKey2Addr,
} from 'scrypt-ts'

export type BalanceMap = HashedMap<Addr, bigint>

export type Allowance = {
    owner: Addr
    spender: Addr
}

export type AllowanceMap = HashedMap<Allowance, bigint>

export type ERC20Pair = {
    address: Addr
    balance: bigint
}

export class ERC20Lib extends SmartContractLib {
    @prop()
    balances: BalanceMap

    @prop()
    allowances: AllowanceMap

    @prop()
    name: ByteString

    @prop()
    symbol: ByteString

    @prop()
    decimals: bigint

    @prop()
    totalSupply: bigint

    @prop()
    issuer: PubKey

    @prop()
    static readonly EMPTY_ADDR: Addr = Addr(
        toByteString('0000000000000000000000000000000000000000')
    )

    constructor(
        name: ByteString,
        symbol: ByteString,
        issuer: PubKey,
        balances: BalanceMap,
        allowances: AllowanceMap
    ) {
        super(name, symbol, issuer, balances, allowances) // Ensure all parameters are passed to the super() call
        this.name = name
        this.symbol = symbol
        this.decimals = 18n
        this.totalSupply = 0n
        this.issuer = issuer
        this.balances = balances
        this.allowances = allowances
    }

    @method()
    mint(owner: Addr, amount: bigint): void {
        const balance = 0n
        if (this.balances.canGet(owner, balance)) {
            this.balances.set(owner, balance + amount)
        } else {
            this.balances.set(owner, amount)
        }
        this.totalSupply += amount
    }

    @method()
    burn(owner: Addr, amount: bigint): void {
        const balance = 0n
        assert(this.balances.canGet(owner, balance), 'Balance not found')
        assert(balance >= amount, 'Burn amount exceeds balance')
        this.balances.set(owner, balance - amount)
        this.totalSupply -= amount
    }

    @method()
    transfer(from: ERC20Pair, to: ERC20Pair, amount: bigint): void {
        assert(
            from.address != ERC20Lib.EMPTY_ADDR,
            'ERC20: transfer from the zero address'
        )
        assert(
            to.address != ERC20Lib.EMPTY_ADDR,
            'ERC20: transfer to the zero address'
        )
        assert(
            this.balances.canGet(from.address, from.balance),
            'ERC20: can not get balance from sender address'
        )
        assert(from.balance >= amount, 'ERC20: transfer amount exceeds balance')

        this.balances.set(from.address, from.balance - amount)

        if (this.balances.canGet(to.address, to.balance)) {
            this.balances.set(to.address, to.balance + amount)
        } else {
            this.balances.set(to.address, amount)
        }
    }

    @method()
    transferFrom(
        currentAllowance: bigint,
        from: ERC20Pair,
        to: ERC20Pair,
        amount: bigint
    ): void {
        assert(
            to.address != ERC20Lib.EMPTY_ADDR,
            'ERC20: approve to the zero address'
        )
        assert(
            this.allowances.canGet(
                {
                    owner: from.address,
                    spender: pubKey2Addr(this.issuer),
                },
                currentAllowance
            )
        )

        assert(
            currentAllowance > 0n && currentAllowance >= amount,
            'ERC20: insufficient allowance'
        )

        // Update allowances
        this.allowances.set(
            {
                owner: from.address,
                spender: pubKey2Addr(this.issuer),
            },
            currentAllowance - amount
        )

        assert(
            from.address != ERC20Lib.EMPTY_ADDR,
            'ERC20: transfer from the zero address'
        )
        assert(
            to.address != ERC20Lib.EMPTY_ADDR,
            'ERC20: transfer to the zero address'
        )
        assert(
            this.balances.canGet(from.address, from.balance),
            'ERC20: can not get balance from sender address'
        )
        assert(from.balance >= amount, 'ERC20: transfer amount exceeds balance')

        this.balances.set(from.address, from.balance - amount)

        if (this.balances.canGet(to.address, to.balance)) {
            this.balances.set(to.address, to.balance + amount)
        } else {
            this.balances.set(to.address, amount)
        }
    }

    @method()
    approve(spender: Addr, amount: bigint): void {
        assert(
            spender != ERC20Lib.EMPTY_ADDR,
            'ERC20: approve to the zero address'
        )

        this.allowances.set(
            {
                owner: pubKey2Addr(this.issuer),
                spender: spender,
            },
            amount
        )
    }

    @method()
    allowance(owner: Addr, spender: Addr, amount: bigint): void {
        assert(
            this.allowances.canGet(
                {
                    owner: owner,
                    spender: spender,
                },
                amount
            )
        )
    }
}
