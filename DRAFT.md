FILE STRUCTURE:

    /manga/{seriesId}/_series.json
    /manga/{seriesId}/{chapterId}.json

SERIES.JSON:

    {
      id: Guid  
      lastChapterAddedAt: Date              // when was the last chapter added?
      lastCheckedAt: Date                   // when was the series checked against online sources?
      metadata: openapi:ISeriesDetail       // providerName can be derived
      automation: {
        frequency: Frequency                // at which frequency should the online check be automated?
        storeAll: boolean                   // should new chapters be stored automatically?
      }
      chapters: {                           // chapters are added from each metadata update, but never removed. So, deleted chapters are visible!
        [url: string]: {
          addedAt: Date                     // when was this chapter added? one should always match `lastChapterAddedAt`
          deletedAt? Date                   // when was this chapter found to have been deleted?
          id: Guid                          // generated identifier for this chapter
          pageCount?: number                // when set, chapter has been made available locally, and the .json should be there!
          title: string                     // backup in case chapter gets deleted from metadata
        }
      }
      users: {
        [name: string]: {                   // default user 'admin' to get everything rolling w/o implementing auth
          addedAt: Date                     // when did this user add this series?
          lastChapterReadAt?: Date          // when did this user last read this series? or did not open yet? (start reading/rediscover)
          chapters: {
            [id: Guid]: {                   // when chapterId exists, user has opened the chapter (continue reading/completed)
              readAt: Date                  // when did this user read this chapter? happens when `pageNumber` is updated, one should always match `lastChapterReadAt`
              pageNumber: number            // when pageNumber === pageCount, user has read the chapter
            }
          }
        }
      }[]
    }

CHAPTER: 

    {
      image: string
    }[]

ENUMERATORS:

    Frequency {
      Never,
      Hourly
      Daily
      Weekly
    }

API:

GET /library
  200
  - return serieslist info by accumulating _series.json and flattening user (image, title, id)
POST /library ({url: string})
  200
  - server must check if url already has an entry
    - if so, add user to list (if not yet added)
    - otherwise get metadata and create new entry with user
  - return id
PUT /library
  200
  - server refreshes metadata for ALL series
  - return result AS GET

GET /library/{seriesId}
  200, 404
  - return described _series.json info flattened for user (for now, 'admin').
DELETE /library/{seriesId}
  200, 404
  - server removes from user list of id, and if last user, deletes series from disk
  - empty result
PUT /library/{seriesId}
  200, 404
  - server refreshes metadata for THIS series
  - return result as GET
PATCH /library/{seriesId} ({automationFrequency, automationStoreAll})
  200, 404
  - sets new options for series
  - empty result
  
GET /library/{seriesId}/{chapterId}
  200, 404
  - creates session for chapter (either online or local)
  - return session id/pageCount
DELETE /library/{seriesId}/{chapterId}
  200, 404
  - force delete of chapter regardless of how many users have it (that's only for series listings to preserve list/states).
  - empty result
PUT /library/{seriesId}/{chapterId}
  200, 404
  - forces refresh for chapter, creats session while getting the new one from online
  - return result as GET
PATCH /library/{seriesId}/{chapterId} ({pageNumber})
  200, 404
  - status update signal to update where you're currently reading
  - empty result
