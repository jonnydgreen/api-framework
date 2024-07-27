# Lifecycle

## Application Lifecycle

The following represents the application lifecycle:

```mermaid
flowchart TD
    S(fa:fa-server Start) --> O(Process options)
    O --> D{Custom driver?}
    D -->|yes| V(Register versions)
    D -->|no| DD(Select default driver) --> V
    V --> K(Build container)
    K --> R(Build and register routes in driver)
    R --> E(fa:fa-server Listening)
```

## Request Lifecycle (core driver)

The following represents the request lifecycle for the core driver:

```mermaid
flowchart TD
    O(Process response)

    S(fa:fa-user Request) --> R(Process request)
    R --> C(Build request context)
    C --> M{Matching route?}
    M -->|No| NF(fa:fa-user 404) --> O
    M -->|Yes| H(Call handler) --> O
    O --> E(fa:fa-user Response)
```
