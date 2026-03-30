'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, markAsRead, getConversation } from '../actions'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, User, Loader2, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ChatInterfaceProps {
    currentUser: any
    initialContacts: any[]
}

interface Message {
    id: string
    sender_id: string
    receiver_id: string
    content: string
    is_read: boolean
    created_at: string
}

export function ChatInterface({ currentUser, initialContacts }: ChatInterfaceProps) {
    const contacts = initialContacts
    const [selectedContact, setSelectedContact] = useState<any>(initialContacts.length === 1 ? initialContacts[0] : null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    // Load conversation when contact changes
    useEffect(() => {
        if (!selectedContact) return

        const loadMessages = async () => {
            setIsLoading(true)
            const msgs = await getConversation(selectedContact.id)
            setMessages(msgs || [])
            setIsLoading(false)
            scrollToBottom()

            // Mark unread as read
            const unreadIds = msgs
                ?.filter((m: Message) => !m.is_read && m.sender_id === selectedContact.id)
                .map((m: Message) => m.id)

            if (unreadIds && unreadIds.length > 0) {
                await markAsRead(unreadIds)
            }
        }

        loadMessages()
    }, [selectedContact])

    // Subscribe to realtime messages
    useEffect(() => {
        if (!selectedContact) return

        const channel = supabase
            .channel('chat_room')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUser.id}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message
                    if (newMsg.sender_id === selectedContact.id) {
                        setMessages((prev) => [...prev, newMsg])
                        scrollToBottom()
                        markAsRead([newMsg.id])
                    } else {
                        // Optional: Show notification dot on other contacts
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedContact, currentUser.id, supabase])

    const scrollToBottom = () => {
        setTimeout(() => {
            if (scrollRef.current) {
                const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
                if (scrollContainer) {
                    scrollContainer.scrollTop = scrollContainer.scrollHeight
                }
            }
        }, 100)
    }

    const handleSend = async () => {
        if (!newMessage.trim() || !selectedContact) return

        const tempId = Date.now().toString()
        const optimisticMsg: Message = {
            id: tempId,
            sender_id: currentUser.id,
            receiver_id: selectedContact.id,
            content: newMessage,
            is_read: false,
            created_at: new Date().toISOString()
        }

        setMessages((prev) => [...prev, optimisticMsg])
        setNewMessage('')
        scrollToBottom()
        setIsSending(true)

        const result = await sendMessage(selectedContact.id, optimisticMsg.content)

        setIsSending(false)

        if (result.error) {
            // Remove optimistic message or show error
            // setMessages(prev => prev.filter(m => m.id !== tempId))
            alert('Error enviando mensaje')
        }
    }

    // Responsive logic: On mobile show list or chat
    const [showList, setShowList] = useState(!selectedContact || initialContacts.length > 1)

    return (
        <div className="flex h-[calc(100dvh-9rem)] min-h-[520px] max-h-[760px] flex-col overflow-hidden rounded-xl border bg-background md:flex-row">
            {/* Sidebar / Contact List */}
            <div className={`
                w-full border-b flex flex-col md:w-80 md:border-b-0 md:border-r
                ${showList ? 'block' : 'hidden md:flex'}
            `}>
                <div className="p-4 border-b bg-muted/30">
                    <h2 className="font-semibold">Contactos</h2>
                </div>
                <ScrollArea className="flex-1">
                    <div className="flex flex-col gap-1 p-2">
                        {contacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => {
                                    setSelectedContact(contact)
                                    setShowList(false)
                                }}
                                className={`
                                    flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                                    ${selectedContact?.id === contact.id ? 'bg-primary/10' : 'hover:bg-muted'}
                                `}
                            >
                                <Avatar>
                                    <AvatarImage src={contact.avatar_url} />
                                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-medium truncate">{contact.full_name || 'Usuario'}</div>
                                    <div className="text-xs text-muted-foreground truncate capitalize">{translateRole(contact.role)}</div>
                                </div>
                            </button>
                        ))}
                        {contacts.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No tienes contactos activos.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`
                flex-1 flex min-h-0 flex-col
                ${!showList ? 'block' : 'hidden md:flex'}
            `}>
                {selectedContact ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 border-b flex items-center gap-3 shadow-sm z-10">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="md:hidden"
                                onClick={() => setShowList(true)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={selectedContact.avatar_url} />
                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium text-sm">{selectedContact.full_name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                                    En línea
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 min-h-0 p-3 sm:p-4 bg-neutral-50 dark:bg-neutral-900/50" ref={scrollRef}>
                            <div className="flex min-h-full flex-col justify-end gap-4">
                                {isLoading ? (
                                    <div className="flex justify-center p-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-muted-foreground my-auto">
                                        Inicia la conversación con un saludo.
                                    </div>
                                ) : (
                                    messages.map((msg) => {
                                        const isMe = msg.sender_id === currentUser.id
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`
                                                        max-w-[88%] rounded-2xl px-4 py-2 text-sm shadow-sm sm:max-w-[80%]
                                                        ${isMe
                                                            ? 'bg-primary text-primary-foreground rounded-br-none'
                                                            : 'bg-white dark:bg-neutral-800 border rounded-bl-none'}
                                                    `}
                                                >
                                                    <p>{msg.content}</p>
                                                    <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                                                        {format(new Date(msg.created_at), 'p', { locale: es })}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-3 border-t bg-background">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2"
                            >
                                <Input
                                    placeholder="Escribe un mensaje..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    className="flex-1 min-w-0"
                                />
                                <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                        <div className="bg-muted p-6 rounded-full mb-4">
                            <User className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium">Selecciona un contacto</h3>
                        <p>Elige una persona de la lista para comenzar a chatear.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function translateRole(role: string) {
    if (role === 'patient') return 'Paciente'
    if (role === 'psychologist') return 'Psicólogo'
    return role
}
