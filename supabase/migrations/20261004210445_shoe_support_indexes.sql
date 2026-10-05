CREATE INDEX support_ticket_messages_ticket_idx ON public.support_ticket_messages(ticket_id,created_at);
CREATE INDEX support_tickets_user_idx ON public.support_tickets(user_id,created_at);
CREATE INDEX support_tickets_order_idx ON public.support_tickets(order_id);
