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

PUT /library
  200
  - server refreshes metadata for ALL series
  - return result AS GET

PATCH /library/{seriesId} ({automationFrequency, automationStoreAll})
  200, 404
  - sets new options for series
  - empty result

GET /library/{seriesId}/{chapterId}
  200, 404
  - if automation.storeAll is set, this will be saved locally as well
  - creates session for chapter (either online or local)
  - return session id/pageCount

DELETE /library/{seriesId}/{chapterId}
  200, 404
  - force delete of chapter regardless of how many users have it (that's only for series listings to preserve list/states).
  - empty result

PUT /library/{seriesId}/{chapterId}
  200, 404
  - forces refresh for chapter, creates session while getting the new one from online
  - unlike a GET, this always stores the library locally as well (even if automation.storeAll == false).
  - return result as GET
  
PATCH /library/{seriesId}/{chapterId} ({pageNumber})
  200, 404
  - status update signal to update where you're currently reading
  - empty result
