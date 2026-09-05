running locally with ssl

openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365 -nodes

set DATABASE_URL in env vars. Run `bun run codegen`

## Admin CLI

There is no admin frontend. `src/cli/` is a command line client for the `/api/admin/*`
endpoints, so administration happens from a terminal — either SSHed into the server or
pointed at it remotely.

### Install

From the repo root:

    bun link

That puts `climbcation-admin` on your PATH. Inside the repo you can skip linking and run:

    bun run admin locations list --pending

Undo the link with `bun unlink`.

### Configuration

The CLI needs a server URL and an admin password matching `ADMIN_PASSWORD` in the
server's environment. Put them in `~/.climbcation-admin.json`:

    {
      "defaultProfile": "local",
      "profiles": {
        "local": {
          "url": "https://localhost:3000",
          "adminPassword": "...",
          "insecure": true
        },
        "prod": {
          "url": "https://climbcation.com",
          "adminPassword": "..."
        }
      }
    }

That file holds a password in plaintext, so `chmod 600 ~/.climbcation-admin.json`. The
CLI prints a warning if other users can read it.

`insecure: true` accepts a self signed certificate. The local dev server needs it; a real
deployment should not have it set.

Select a profile with `--profile prod`. Environment variables override the file:
`CLIMBCATION_API_URL`, `CLIMBCATION_ADMIN_PASSWORD`, `CLIMBCATION_INSECURE` and
`CLIMBCATION_PROFILE`. Running with no configuration at all prints a skeleton to copy.

### Commands

    edits list [--type <type>]              unapproved location edits
    edits show <editId>                     full contents of one queued edit
    edits approve <editId>                  apply a queued edit to the live location

    locations list [--pending | --active]   locations by approval state
    locations approve <locationId>          make a submitted location publicly visible
    locations update <locationId> [fields]  edit location fields directly
    locations image <locationId> <path>     replace the location thumbnail

Edit types are `accommodation`, `food_options`, `getting_in` and `misc`.

`locations update` takes `--name`, `--slug`, `--continent`, `--country`,
`--airport-code`, `--rating`, `--latitude`, `--longitude` and
`--solo-friendly` / `--no-solo-friendly`. Only the fields you pass are changed.

Global flags: `--profile <name>`, `--json`, `--yes` to skip confirmation, `--dry-run` to
print the request without sending it, and `--help`.

    climbcation-admin locations list --pending
    climbcation-admin edits show 472
    climbcation-admin --profile prod locations update 174 --rating 4 --country Spain

### Notes

The server has to be running. The CLI only speaks HTTP and never opens a database
connection of its own.

Approving is irreversible, and there is no reject. Edits that are never approved stay
queued forever, so `edits list` is a backlog rather than an inbox. Mutating commands ask
for confirmation unless given `--yes`, and refuse to run non-interactively without it.

`--dry-run` still performs reads, so previews are built from real data. Only the write is
withheld.
