FILE STRUCTURE:

    /library/{seriesId}/series.json
    /library/{seriesId}/{chapterId}/{pageNumber:000}.json

SERIES.JSON:

    {
      automation: {
        frequency: Frequency                // at which frequency should the online check be automated?
        syncAll: boolean                   // should new chapters be stored automatically?
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
  
AUTOMATION:

GET /library/{seriesId}/{chapterId}
  200, 404
  - if automation.storeAll is set, this will be saved locally as well

PATCH /library/{seriesId} ({automationFrequency, automationStoreAll})
  200, 404
  - sets new options for series
  - empty result
