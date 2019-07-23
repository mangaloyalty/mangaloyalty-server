FILE STRUCTURE:

    /library/{seriesId}/series.json
    /library/{seriesId}/{chapterId}/{pageNumber:000}.json

SERIES.JSON:

    {
      automation: {
        frequency: Frequency                // at which frequency should the online check be automated?
        storeAll: boolean                   // should new chapters be stored automatically?
      }
    }

CHAPTER/PAGE: 

    {
      image: string
    }

ENUMERATORS:

    Frequency {
      Never,
      Hourly
      Daily
      Weekly
    }

API:

GET /library/{seriesId}/{chapterId}
  200, 404
  - creates session for chapter (either online or local)
  - return session id/pageCount

DELETE /library/{seriesId}/{chapterId}
  200, 404
  - force delete of chapter regardless of how many users have it (that's only for series listings to preserve list/states).
  - empty result
  
PATCH /library/{seriesId}/{chapterId} ({pageNumber})
  200, 404
  - status update signal to update where you're currently reading
  - empty result

AUTOMATION:

GET /library/{seriesId}/{chapterId}
  200, 404
  - if automation.storeAll is set, this will be saved locally as well

PATCH /library/{seriesId} ({automationFrequency, automationStoreAll})
  200, 404
  - sets new options for series
  - empty result
