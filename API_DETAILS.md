# External Search & Apply API Documentation

This document outlines the external "Search and Apply" API endpoints used for country, university, and program selection within the CRM.

**Base URL:** `https://www.educationmalaysia.in/api/search-and-apply`

---

## 1. Fetch Countries
Retrieves a list of available countries.

- **Endpoint:** `/countries`
- **Method:** `GET`
- **Parameters:** None

---

## 2. Fetch Universities
Retrieves a list of universities, optionally filtered by country website.

- **Endpoint:** `/universities`
- **Method:** `GET`

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `website` | string | No | Filter universities by country website/domain. |

---

## 3. Fetch Academic Levels
Retrieves available study levels (e.g., Undergraduate, Postgraduate) for a specific university.

- **Endpoint:** `/levels`
- **Method:** `GET`

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `university_id` | number | Yes | The ID of the selected university. |

---

## 4. Fetch Course Categories
Retrieves discipline categories available for a specific university and level.

- **Endpoint:** `/categories`
- **Method:** `GET`

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `university_id` | number | Yes | The ID of the selected university. |
| `level` | string | Yes | The selected academic level. |

---

## 5. Fetch Specializations
Retrieves specific study paths within a chosen category.

- **Endpoint:** `/specializations`
- **Method:** `GET`

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `university_id` | number | Yes | The ID of the selected university. |
| `level` | string | Yes | The selected academic level. |
| `course_category_id` | number | Yes | The ID of the selected course category. |

---

## 6. Fetch Programs
Retrieves the final list of programs matching all selection criteria.

- **Endpoint:** `/programs`
- **Method:** `GET`

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `university_id` | number | Yes | The ID of the selected university. |
| `level` | string | Yes | The selected academic level. |
| `course_category_id` | number | Yes | The ID of the selected course category. |
| `specialization_id` | number | Yes | The ID of the selected specialization. |

---

> [!NOTE]
> All endpoints are proxied through the local backend at `/api/external-search/*` to handle agent access control and API resilience.