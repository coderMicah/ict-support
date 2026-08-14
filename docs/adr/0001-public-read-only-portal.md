# ADR-0001: Public read-only portal alongside authenticated internal portal

The portal is split into two surfaces sharing one knowledge base: a **public** read-only portal (published articles, approved documents, active contacts) that requires no sign-in, and an **authenticated** internal portal that adds role-aware management for officers and administration for the Head of ICT.

An earlier assumption held that all content was behind authentication ("sign in to access…"). This was reversed after clarifying the audience: general staff are the primary readers of ICT guidance, and requiring an account to read a guide adds needless friction and reduces the portal's usefulness. The split is cheap because the public surface simply filters to `published`/`approved`/`active` content; management actions and administrative navigation remain gated by role. Public visitors never see drafts, unpublished or unapproved content, or administrative functionality.
