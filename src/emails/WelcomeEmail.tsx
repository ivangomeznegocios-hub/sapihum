import * as React from 'react'
import {
    Html,
    Body,
    Head,
    Heading,
    Container,
    Preview,
    Text,
} from '@react-email/components'
import { brandName } from '@/lib/brand'

interface WelcomeEmailProps {
    name: string
}

export default function WelcomeEmail({ name }: WelcomeEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Bienvenido(a) a {brandName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Bienvenido(a), {name}!</Heading>
                    <Text style={text}>
                        Tu cuenta en {brandName} ya esta lista.
                        Ahora puedes acceder a tu panel y continuar con tu proceso en la plataforma.
                    </Text>
                    <Text style={text}>
                        Si acabas de recibir una invitacion, sigue el enlace del correo para completar tu acceso.
                    </Text>
                    <Text style={footer}>
                        Si tienes alguna duda, no dudes en contactarnos.
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

const main = {
    backgroundColor: '#f6f9fc',
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
}

const h1 = {
    color: '#333',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '40px',
    margin: '0 0 20px',
    padding: '0 48px',
}

const text = {
    color: '#555',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 20px',
    padding: '0 48px',
}

const footer = {
    color: '#888',
    fontSize: '14px',
    lineHeight: '24px',
    margin: '30px 0 0',
    padding: '0 48px',
}
