import * as React from 'react'
import {
    Html,
    Body,
    Head,
    Heading,
    Container,
    Preview,
    Section,
    Text,
    Link,
} from '@react-email/components'

interface AppointmentConfirmationEmailProps {
    patientName: string
    psychologistName: string
    date: string
    time: string
    meetingLink?: string
}

export default function AppointmentConfirmationEmail({
    patientName,
    psychologistName,
    date,
    time,
    meetingLink
}: AppointmentConfirmationEmailProps) {
    return (
        <Html>
            <Head />
            <Preview>Confirmación de Cita con {psychologistName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Hola, {patientName}</Heading>
                    <Text style={text}>
                        Tu cita con <strong>{psychologistName}</strong> ha sido confirmada.
                    </Text>

                    <Section style={detailsContainer}>
                        <Text style={details}>📅 <strong>Fecha:</strong> {date}</Text>
                        <Text style={details}>⏰ <strong>Hora:</strong> {time}</Text>
                        {meetingLink && (
                            <Text style={details}>
                                🔗 <strong>Enlace de la sesión:</strong>{' '}
                                <Link href={meetingLink} style={link}>{meetingLink}</Link>
                            </Text>
                        )}
                    </Section>

                    <Text style={footer}>
                        Si necesitas cancelar o reprogramar, por favor contacta a tu psicólogo(a)
                        con al menos 24 horas de anticipación.
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

const detailsContainer = {
    background: '#f4f4f4',
    borderRadius: '8px',
    padding: '24px',
    margin: '0 48px 24px',
}

const details = {
    color: '#333',
    fontSize: '16px',
    margin: '0 0 10px',
}

const link = {
    color: '#2754C5',
    textDecoration: 'underline',
}

const footer = {
    color: '#888',
    fontSize: '14px',
    lineHeight: '24px',
    margin: '30px 0 0',
    padding: '0 48px',
    borderTop: '1px solid #eaeaea',
    paddingTop: '20px',
}
