# View API

## Required

### Get pages

`GET /api/view/pages/<macAddr<string(17)>>.json`

Response:

```json
Content-Type: application/json

{
    "reload": seconds<integer>,
    "urls": [
        {
            "duration": seconds<integer>,
            "url": string
        },
        ...
    ]
}
```

## Optional, but recommended

### Notify the admin ui on page change

`PUT /api/view/currUrl`

```json
Content-Type: application/json

{
   "ref": string,
   "url": string
}
```

Response: Ok if Ok
