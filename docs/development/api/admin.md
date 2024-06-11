# Admin API

## General

### All data for the admin ui
`GET /api/admin/alldata.json`

Response:

```json
Content-Type: application/json

{
    "groups": {
        uuid<string(36)>: {
            "name": string,
            "readonly": boolean,
            "reload": seconds<integer>,
            "urls": [
                {
                    "duration": seconds<integer>,
                    "url": string
                },
                ...
            ]
        },
        ...
    },
    "refs": {
        macAddr<string(17)>: {
            "name": string,
            "preview": url<string>,
            "group": uuid<string(36)>
        },
        ...
    }
}
```

### List mounted cloud directory

`GET /api/admin/ls`

Response:

```json
Content-Type: application/json

[
    {
        "path": string,
        "isDir": boolean
    },
    ...
]
```

## Device

### Set group of device

`PATCH /api/admin/setRefGroup?ref=<macAddr<string(17)>>&group=<uuid<string(36)>>`

No response

### Set name of device

`PATCH /api/admin/setRefName?ref=<macAddr<string(17)>>&name=<string>`

No response

## Group

### Set name of group

`PATCH /api/admin/setGroupName?group=<uuid<string(36)>>&name=<string>`

No response

### Set content of group

```json
PUT /api/admin/setGroupContent?group=<uuid<string(36)>>
Content-Type: application/json

{
    "name": string,
    "reload": seconds<integer>,
    "urls": [
        {
            "duration": seconds<integer>,
            "url": string
        }
    ]
}
```

### Create group

`POST /api/admin/createGroup?name=<string>`

Response:

```json
Content-Type: application/json

{
    "status": "ok" | "error",
    [if status == "ok"]
        "uuid": string(36)
    [else]
        "message": "string"
    [endif]
}