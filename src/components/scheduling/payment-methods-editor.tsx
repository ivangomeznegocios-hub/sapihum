'use client'

import { useState } from 'react'
import { CreditCard, Banknote, Wallet } from 'lucide-react'

interface PaymentMethods {
    paypal?: string
    stripe?: string
    mercadopago?: string
    bank_transfer?: {
        bank: string
        clabe: string
        name: string
    }
    cash?: boolean
}

interface PaymentMethodsEditorProps {
    value: PaymentMethods
    onChange: (methods: PaymentMethods) => void
}

export function PaymentMethodsEditor({ value, onChange }: PaymentMethodsEditorProps) {
    const updateMethod = (method: string, fieldValue: any) => {
        onChange({ ...value, [method]: fieldValue })
    }

    const toggleMethod = (method: string, enabled: boolean) => {
        if (enabled) {
            if (method === 'cash') {
                updateMethod(method, true)
            } else if (method === 'bank_transfer') {
                updateMethod(method, { bank: '', clabe: '', name: '' })
            } else {
                updateMethod(method, '')
            }
        } else {
            const newValue = { ...value }
            delete newValue[method as keyof PaymentMethods]
            onChange(newValue)
        }
    }

    return (
        <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
                Configura los métodos de pago que aceptas. Los pacientes verán estas opciones al agendar.
            </div>

            <div className="space-y-4">
                {/* PayPal */}
                <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="paypal-enabled"
                            checked={value.paypal !== undefined}
                            onChange={(e) => toggleMethod('paypal', e.target.checked)}
                            className="h-4 w-4"
                        />
                        <label htmlFor="paypal-enabled" className="font-medium flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-brand-yellow" />
                            PayPal
                        </label>
                    </div>
                    {value.paypal !== undefined && (
                        <input
                            type="email"
                            value={value.paypal || ''}
                            onChange={(e) => updateMethod('paypal', e.target.value)}
                            placeholder="email@paypal.com"
                            className="mt-3 w-full px-3 py-2 border rounded-lg bg-background text-sm"
                        />
                    )}
                </div>

                {/* Stripe */}
                <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="stripe-enabled"
                            checked={value.stripe !== undefined}
                            onChange={(e) => toggleMethod('stripe', e.target.checked)}
                            className="h-4 w-4"
                        />
                        <label htmlFor="stripe-enabled" className="font-medium flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-brand-brown" />
                            Stripe (Link de pago)
                        </label>
                    </div>
                    {value.stripe !== undefined && (
                        <input
                            type="url"
                            value={value.stripe || ''}
                            onChange={(e) => updateMethod('stripe', e.target.value)}
                            placeholder="https://buy.stripe.com/..."
                            className="mt-3 w-full px-3 py-2 border rounded-lg bg-background text-sm"
                        />
                    )}
                </div>

                {/* MercadoPago */}
                <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="mercadopago-enabled"
                            checked={value.mercadopago !== undefined}
                            onChange={(e) => toggleMethod('mercadopago', e.target.checked)}
                            className="h-4 w-4"
                        />
                        <label htmlFor="mercadopago-enabled" className="font-medium flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-brand-yellow" />
                            MercadoPago (Link de pago)
                        </label>
                    </div>
                    {value.mercadopago !== undefined && (
                        <input
                            type="url"
                            value={value.mercadopago || ''}
                            onChange={(e) => updateMethod('mercadopago', e.target.value)}
                            placeholder="https://link.mercadopago.com.mx/..."
                            className="mt-3 w-full px-3 py-2 border rounded-lg bg-background text-sm"
                        />
                    )}
                </div>

                {/* Bank Transfer */}
                <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="bank-enabled"
                            checked={value.bank_transfer !== undefined}
                            onChange={(e) => toggleMethod('bank_transfer', e.target.checked)}
                            className="h-4 w-4"
                        />
                        <label htmlFor="bank-enabled" className="font-medium flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-green-600" />
                            Transferencia Bancaria
                        </label>
                    </div>
                    {value.bank_transfer !== undefined && (
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <input
                                type="text"
                                value={value.bank_transfer?.bank || ''}
                                onChange={(e) => updateMethod('bank_transfer', {
                                    ...value.bank_transfer,
                                    bank: e.target.value
                                })}
                                placeholder="Banco (ej: BBVA)"
                                className="px-3 py-2 border rounded-lg bg-background text-sm"
                            />
                            <input
                                type="text"
                                value={value.bank_transfer?.clabe || ''}
                                onChange={(e) => updateMethod('bank_transfer', {
                                    ...value.bank_transfer,
                                    clabe: e.target.value
                                })}
                                placeholder="CLABE"
                                className="px-3 py-2 border rounded-lg bg-background text-sm"
                            />
                            <input
                                type="text"
                                value={value.bank_transfer?.name || ''}
                                onChange={(e) => updateMethod('bank_transfer', {
                                    ...value.bank_transfer,
                                    name: e.target.value
                                })}
                                placeholder="Nombre del titular"
                                className="px-3 py-2 border rounded-lg bg-background text-sm"
                            />
                        </div>
                    )}
                </div>

                {/* Cash */}
                <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="cash-enabled"
                            checked={value.cash === true}
                            onChange={(e) => toggleMethod('cash', e.target.checked)}
                            className="h-4 w-4"
                        />
                        <label htmlFor="cash-enabled" className="font-medium flex items-center gap-2">
                            <Banknote className="h-4 w-4 text-brand-brown" />
                            Efectivo (en consultorio)
                        </label>
                    </div>
                    {value.cash && (
                        <p className="mt-2 text-sm text-muted-foreground">
                            El paciente pagará en efectivo el día de la cita.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
