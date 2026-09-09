# Product brief

Two support agents move the same cards while one connection repeatedly drops. Both browsers must converge on the server order after reconnect. Retried commands must never move a card twice.

Keep one authoritative sequence on the server. Presence is temporary. Client state is a projection, not the database.
