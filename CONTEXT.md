# Zonal ICT Knowledge Hub

An ICT knowledge and support portal for an organisation. A public read-only portal gives staff and the public ICT guidance (published articles, approved documents, active contacts) without sign-in; an authenticated internal portal adds content management for ICT Officers and administration for the Head of ICT.

## Existing Decisions

- **Stack**: TanStack Start, React, TanStack Router, PostgreSQL, Drizzle ORM, Better Auth, Tailwind CSS, shadcn/ui, Lexical.
- **Database**: PostgreSQL. **ORM**: Drizzle.
- **Authentication**: Better Auth with the Admin plugin; access control via Better Auth's access-control engine.
- **Roles**: two roles.
  - `admin` — Head of ICT. Full portal administration; controls user approval, publishing, approval, archiving, and deletion.
  - `user` — ICT Officer. Creates and maintains knowledge-base content; cannot publish/approve/archive/delete.
- **Content visibility**: two portals share the same knowledge base.
  - **Public portal** (no sign-in): published articles, approved documents, and active ICT contacts only.
  - **Internal portal** (authenticated): the same browsing experience plus role-aware management (officers manage content; admin administers).
- **There is no sign-in requirement to read the knowledge base.**
- **Account provisioning**: self-signup creates `user` accounts with `approved = false`; new accounts cannot sign in until an administrator approves them. Self-registration never grants admin privileges. The Head of ICT approves accounts and promotes them to `admin` through the administration screen.
- **Account approval**: new accounts must be approved by an admin before they can sign in. Pending accounts see a "pending approval" notice; sign-in attempts are rejected until approved.
- **Article body**: Lexical rich text stored as structured JSON in a PostgreSQL JSONB column.
- **The system is an internal portal**, not a public knowledge platform. Initial scope stays simple and maintainable.
- **Deployment**: on-premise internal server controlled by the organisation.
- **File storage**: persistent local disk in a dedicated uploads directory (documents and article images), backed up with the server. No object storage initially; the storage layer is abstracted so S3-compatible storage can be introduced later if the environment changes.

## Settled Requirements

### Categories
- Flat list, no parent/child hierarchy.
- Fields: name, slug, description, sort order.
- Hierarchy may be introduced later only if the knowledge base grows significantly.

### Articles
- Each article belongs to exactly one category (required `categoryId`).
- No many-to-many category assignment.
- Related content is derived from other published articles in the same category.
- **States**: `draft`, `published`, `archived`. Articles start as draft.
- Officers can create and edit draft and published articles; editing is shared across officers (drafts are visible to all officers, no per-author isolation).
- Only admin can publish, archive, restore, or permanently delete articles.
- Archived articles are hidden from browsing and search but remain stored.
- **URLs**: article URLs are slug-based. Each article has a unique slug auto-generated from the title at creation; it is not auto-regenerated on title changes (shared links stay stable), but can be edited manually. Uniqueness is enforced at the database level.
- **Excerpt**: articles have an optional `excerpt` field, editable, auto-suggested from the body. It is used in category listings, search results, and link previews, with a derived fallback when absent.

### Documents
- ICT forms and templates that staff can download.
- **States**: `draft`, `approved`, `archived`. Documents start as draft.
- Officers can create and edit non-archived documents. Only admin approves, archives, restores, or permanently deletes.
- Only approved documents are visible in the staff download area; drafts are management-visible to the ICT team only.
- Editing an approved document keeps it approved — no automatic re-approval or versioning at this stage.
- Documents use the same flat category tree as articles, via an **optional** `categoryId` (so administrative/miscellaneous documents can exist without a category).
- Documents also have a dedicated downloads section for direct browsing.

### Search
- Single global search across articles, documents, and contacts using PostgreSQL full-text search (`tsvector` + GIN index, ranked).
- Articles are searched by title, excerpt, and body; documents by title; contacts by name, role, and contact details.
- Results are grouped by content type.
- A derived plain-text representation of the Lexical body is stored alongside the JSON so the body can be indexed.
- Search results respect authorization: public search returns only published articles, approved documents, and active contacts; authenticated users may also see management content their role allows.

### Usability & feedback
- Usability is tested manually with selected staff; feedback flows through the normal ICT support/contact process.
- No feedback table, ratings, or in-product feedback workflow in the initial version.
- Published articles may include a "Report a problem" / "Suggest a change" link that routes to the appropriate ICT contact.

### Knowledge base home
- The home page (public and internal) focuses on: global search, category navigation, and recently published articles.
- No featured-article field/management; no most-accessed/popular tracking (usage tracking is out of scope initially).

### Admin documentation & handover
- The admin guide is maintained as project documentation (not portal articles) and delivered with the source.
- "Source files" means the complete project source code and related project files delivered to the organisation at handover; no source-files feature or portal section is built.

### Editor (Lexical)
- Feature set: headings, bold, italic, underline, links, bullet and numbered lists, images, undo/redo, and simple **tables** (insert table, add/remove rows and columns, edit cell contents). No advanced spreadsheet functionality.

### Implementation defaults
- **Uploads**: article images are common web types (jpg/png/gif/webp/svg) up to ~5MB; documents are common office/PDF types up to ~20MB. Filenames are sanitized; files are stored in the uploads directory and served through an app route, never exposed raw.
- **Validation**: all mutations validated server-side (required title, unique slug, required category for articles). Admin-only transitions (publish/approve/archive) are enforced in server functions, never only hidden in the UI.
- **Error handling**: `AppError` hierarchy (`UnauthorizedError`, `ForbiddenError`, validation errors) surfaced as user-visible messages.
- **Security**: every server function re-checks permissions via `requireServerSession` / `requirePermission` / `requireAdminSession`; public routes query only published/approved/active content.
- **Performance**: FTS GIN index plus FK indexes; no further optimization at this scale.

### Contacts
- A dedicated table, independently managed — not content.
- Fields: name, role/title, phone, email, optional coverage/notes, sort order, active flag.
- Contacts do not require a category.
- Escalation **procedures** are knowledge-base articles under a support category (e.g., "ICT Support & Escalation"), not an escalation table.

## Language

**Article**:
A practical guide or information page in the knowledge base, written in the Lexical editor and published for staff to read.
_Avoid_: Page, post, KB entry

**Category**:
A flat grouping used to organise articles for browsing and navigation.
_Avoid_: Section, topic group, folder

**Public portal**:
The no-sign-in surface exposing only published articles, approved documents, and active contacts.
_Avoid_: Landing, homepage

**Internal portal**:
The authenticated surface where officers manage content and the Head of ICT administers the system.
_Avoid_: Admin portal, CMS

**Document**:
An approved ICT form or template that staff can download.
_Avoid_: File, attachment, upload
