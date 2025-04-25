# Teamify - Team Generator API

A NestJS application for generating random teams from a list of names.

## Features

- Generate random teams based on user-defined parameters
- Upload CSV files with lists of names
- Export team assignments to PDF
- RESTful API with Swagger documentation

## API Endpoints

The API is documented using Swagger. Once running, view the documentation at:
`http://localhost:3000/api`

### Main Endpoints

- `POST /team-generator/generate` - Generate teams with provided parameters
- `POST /team-generator/upload-csv` - Upload a CSV file with names
- `POST /team-generator/export-pdf` - Export generated teams to PDF

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm

### Installation

1. Clone the repository
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

### Generate Teams via API

```bash
curl -X POST http://localhost:3000/team-generator/generate \
  -H "Content-Type: application/json" \
  -d '{
    "numberOfGroups": 3,
    "maxMembersPerGroup": 5,
    "names": ["Alice", "Bob", "Charlie", "Dave", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy"]
  }'
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
```

### Export to PDF

```bash
curl -X POST http://localhost:3000/team-generator/export-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "numberOfGroups": 3,
    "maxMembersPerGroup": 5,
    "names": ["Alice", "Bob", "Charlie", "Dave", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy"]
  }' \
  -o teams.pdf
```

The Swagger documentation provides a nice web interface for testing the API directly in the browser. Users can navigate to `http://localhost:3000/api` to see all the available endpoints, their parameters, and try them out.
