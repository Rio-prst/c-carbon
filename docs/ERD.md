# Entity Relationship Diagram

## Logical ERD

```mermaid
erDiagram
    USERS ||--o{ FARMS : owns
    FARMS ||--o{ FARM_SEASONS : has
    FARM_SEASONS ||--o{ FARM_DATA : contains
    FARM_DATA ||--o{ EVIDENCE : supported_by

    FARMS ||--o{ INSURANCE : has
    FARMS ||--o{ SCORES : produces

    USERS ||--o{ REWARDS : earns

    CARBON_PROJECTS ||--o{ PROJECT_FARMS : aggregates
    FARMS ||--o{ PROJECT_FARMS : included_in

    USERS ||--|| CORPORATES : represents
    USERS ||--o{ CONSENTS : grants
    USERS ||--o{ AUDIT_LOGS : performs

    USERS {
      uuid id PK
      string name
      string email UK
      string password_hash
      enum role
      datetime created_at
      datetime updated_at
    }

    FARMS {
      uuid id PK
      uuid user_id FK
      string digital_farm_id UK
      string name
      decimal lat
      decimal lng
      decimal land_area_ha
      string commodity
      enum status
    }

    FARM_SEASONS {
      uuid id PK
      uuid farm_id FK
      string season_label
      date start_date
      date end_date
      int sequence_number
    }

    FARM_DATA {
      uuid id PK
      uuid farm_season_id FK
      decimal yield_kg
      decimal water_usage
      decimal fertilizer_usage
      decimal pesticide_usage
      string waste_management_practice
      string soil_practice
      decimal energy_usage
      boolean low_carbon_practice
      enum status
      datetime submitted_at
    }

    EVIDENCE {
      uuid id PK
      uuid farm_data_id FK
      enum type
    }

    INSURANCE {
      uuid id PK
      uuid farm_id FK
      string partner
      enum status
    }

    SCORES {
      uuid id PK
      uuid farm_id FK
      string score_type
      decimal value
      json breakdown
      boolean is_provisional
      datetime calculated_at
    }

    REWARDS {
      uuid id PK
      uuid user_id FK
      string event_type
      int points
      int total_points
      string tier
      datetime created_at
    }

    CARBON_PROJECTS {
      uuid id PK
      string name
      enum status
      string region
      string commodity_focus
      int total_farms
      decimal total_area_ha
      datetime created_at
    }

    PROJECT_FARMS {
      uuid carbon_project_id FK
      uuid farm_id FK
      datetime added_at
    }

    CORPORATES {
      uuid id PK
      uuid user_id FK
      string company_name
      string industry
      string region
      string status
    }

    CONSENTS {
      uuid id PK
      uuid user_id FK
      string consent_version
      string purpose
      datetime granted_at
      datetime revoked_at
    }

    AUDIT_LOGS {
      uuid id PK
      uuid actor_user_id FK
      string action
      string target_entity
      uuid target_id
      json metadata
      datetime created_at
    }
```

## Relationship rules

- A farmer owns one or more farms.
- A farm has multiple seasons.
- A season has farm data submissions.
- Farm data may have multiple evidence records.
- A farm may have insurance records.
- A farm produces score records.
- A user earns reward records.
- Projects aggregate farms through `project_farms`.
- Corporate identity is attached one-to-one to a user.
- Consent belongs to a user.
- Audit logs identify the user who performed the action.

## Privacy boundary

Corporate project APIs must aggregate:
- farm count
- area
- commodity
- region
- project status
- other explicitly approved aggregate indicators

They must not return individual farmer identities in the MVP.
