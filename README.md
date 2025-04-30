# Teamify - Team Generator API

A NestJS application for generating random teams from a list of names with smart distribution features.

## Features

- Generate random teams with flexible group size distribution
- Customize specific group sizes while allowing automatic distribution for others
- Randomized member assignment for fair team creation
- Upload CSV files with lists of names
- Export team assignments to PDF
- RESTful API with comprehensive Swagger documentation

## API Endpoints

The API is documented using Swagger. Once running, view the documentation at:
`http://localhost:3000/api`

### Main Endpoints

#### `POST /team-generator/generate`

Generate teams with flexible group size distribution.

- If no custom sizes are provided, participants are distributed evenly across all groups
- If custom sizes are specified for some groups, those groups get exactly that many members
- Remaining participants are distributed evenly among groups without custom sizes
- When distribution is uneven, groups receiving extra members are randomized
- All groups must have at least 1 member

#### `POST /team-generator/upload-csv`

Upload a CSV file containing names to be used for team generation.

#### `POST /team-generator/export-pdf`

Generate teams and export the result to a downloadable PDF file.

## Group Size Distribution Features

### Even Distribution

When the number of participants divides evenly by the number of groups, all groups will have the same number of members.

### Custom Group Sizes

You can specify exact sizes for specific groups. For example, you might want:

- Group 1 to have exactly 5 members
- Group 3 to have exactly 4 members
- Let the system automatically distribute the remaining participants to groups 2 and 4

### Group Locking

The API supports locking certain people together so they will always be placed in the same team:

- Create locked groups to ensure specific people always stay together
- Multiple locked groups can be defined
- Each person can only be in one locked group
- Each locked group must have at least 2 members

### Smart Distribution for Uneven Groups

When even distribution isn't possible, the system randomly determines which groups get the extra members, rather than always assigning extras to the first groups.

## Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- npm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/handikatriarlan/teamify.git
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run start:dev
```

4. The API will be available at `http://localhost:3000`
5. Swagger documentation will be available at `http://localhost:3000/api`

## Usage Examples

### Generate Teams with Default Distribution

```bash
curl -X POST http://localhost:3000/team-generator/generate \
  -H "Content-Type: application/json" \
  -d '{
    "numberOfGroups": 3,
    "names": ["Alice", "Bob", "Charlie", "Dave", "Eve", "Frank", "Grace", "Heidi"]
  }'
```

Response:

```json
{
  "teams": [
    {
      "name": "Group 1",
      "members": [
        { "name": "Charlie" },
        { "name": "Frank" },
        { "name": "Alice" }
      ],
      "size": 3
    },
    {
      "name": "Group 2",
      "members": [{ "name": "Dave" }, { "name": "Bob" }],
      "size": 2
    },
    {
      "name": "Group 3",
      "members": [{ "name": "Eve" }, { "name": "Grace" }, { "name": "Heidi" }],
      "size": 3
    }
  ],
  "totalParticipants": 8,
  "totalTeams": 3,
  "generatedAt": "2023-08-15T14:30:45.123Z",
  "isEvenDistribution": false
}
```

### Generate Teams with Custom Group Sizes

```bash
curl -X POST http://localhost:3000/team-generator/generate \
  -H "Content-Type: application/json" \
  -d '{
    "numberOfGroups": 4,
    "names": ["Alice", "Bob", "Charlie", "Dave", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy"],
    "customGroupSizes": [
      {"groupId": 1, "size": 3},
      {"groupId": 3, "size": 4}
    ],
    "groupNames": [
      {"groupId": 1, "name": "Team Alpha"},
      {"groupId": 2, "name": "Team Beta"},
      {"groupId": 3, "name": "Team Gamma"},
      {"groupId": 4, "name": "Team Delta"}
    ]
  }'
```

Response:

```json
{
  "teams": [
    {
      "name": "Team Alpha",
      "members": [{ "name": "Bob" }, { "name": "Frank" }, { "name": "Judy" }],
      "size": 3
    },
    {
      "name": "Team Beta",
      "members": [{ "name": "Charlie" }, { "name": "Eve" }],
      "size": 2
    },
    {
      "name": "Team Gamma",
      "members": [
        { "name": "Dave" },
        { "name": "Grace" },
        { "name": "Ivan" },
        { "name": "Alice" }
      ],
      "size": 4
    },
    {
      "name": "Team Delta",
      "members": [{ "name": "Heidi" }],
      "size": 1
    }
  ],
  "totalParticipants": 10,
  "totalTeams": 4,
  "generatedAt": "2023-08-15T14:35:12.456Z",
  "isEvenDistribution": false
}
```

### Generate Teams with Locking Feature

```json
{
  "numberOfGroups": 3,
  "names": [
    "Alice",
    "Bob",
    "Charlie",
    "Dave",
    "Eve",
    "Frank",
    "Grace",
    "Heidi"
  ],
  "lockedGroups": [
    { "names": ["Alice", "Bob"] },
    { "names": ["Charlie", "Dave", "Eve"] }
  ]
}
```

Response:

```json
{
  "teams": [
    {
      "name": "Group 1",
      "members": [
        {
          "name": "Frank"
        },
        {
          "name": "Heidi"
        }
      ],
      "size": 2
    },
    {
      "name": "Group 2",
      "members": [
        {
          "name": "Charlie"
        },
        {
          "name": "Dave"
        },
        {
          "name": "Eve"
        }
      ],
      "size": 3
    },
    {
      "name": "Group 3",
      "members": [
        {
          "name": "Alice"
        },
        {
          "name": "Bob"
        },
        {
          "name": "Grace"
        }
      ],
      "size": 3
    }
  ],
  "totalParticipants": 8,
  "totalTeams": 3,
  "generatedAt": "2025-04-30T11:18:41.745Z",
  "isEvenDistribution": false
}
```

### Upload CSV File

```bash
curl -X POST http://localhost:3000/team-generator/upload-csv \
  -F "file=@names.csv"
```

Example CSV format:

```bash
name
Alice
Bob
Charlie
Dave
```

### Export to PDF

```bash
curl -X POST http://localhost:3000/team-generator/export-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "numberOfGroups": 3,
    "names": ["Alice", "Bob", "Charlie", "Dave", "Eve", "Frank", "Grace", "Heidi"],
    "customGroupSizes": [{"groupId": 1, "size": 4}]
  }' \
  -o teams.pdf
```

## API Validation Features

The API includes comprehensive validation to ensure:

- All groups have at least one member
- Custom group sizes don't exceed the total number of participants
- There are enough participants for all groups
- No duplicate group IDs in custom sizes
- No duplicate participant names (automatically deduplicated)
- Group IDs are valid (between 1 and the total number of groups)

## PDF Export Features

The generated PDF includes:

- Team names and member lists
- Total number of participants and teams
- Generation timestamp
- Distribution information (even or uneven)
- Clean, professional formatting

## CORS Configuration

This API supports Cross-Origin Resource Sharing (CORS) for frontend applications:

### Development

During development, CORS is enabled for all origins by default.

### Production

For production, set the `ALLOWED_ORIGINS` environment variable to restrict access:

```bash
# In .env file or environment variables
ALLOWED_ORIGINS=https://your-frontend.com,https://another-frontend.com
```
