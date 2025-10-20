# Resolution Summary

**Incident ID:** UNKNOWN
**Resolution Outcome:** SUCCESS
**Timestamp:** 2025-10-20T08:46:08.370211

## Error Details
- **Error Identified:** Container data issue
- **Root Cause:** Data synchronization problem

## Actions Taken
- Search the vessel_advice_service.log for occurrences of error code VESSEL_ERR_4 by running: grep -i "VESSEL_ERR_4" vessel_advice_service.log
- Query the vessel_advice table to find all vessel advice records for vessel name 'MV Lion City 07' ordered by effective_start_datetime by running: SELECT vessel_advice_no, system_vessel_name, effective_start_datetime, effective_end_datetime, system_vessel_name_active FROM vessel_advice WHERE system_vessel_name = 'MV Lion City 07' ORDER BY effective_start_datetime;
- Identify if there is an active vessel advice record for 'MV Lion City 07' by checking for a row where effective_end_datetime IS NULL; record the vessel_advice_no of this active advice if it exists
- If an active vessel advice exists, query the berth_application table to find any active port programs linked to this vessel advice by running: SELECT application_no, vessel_advice_no, vessel_close_datetime, deleted, berthing_status FROM berth_application WHERE vessel_advice_no = '<active_vessel_advice_no>' AND vessel_close_datetime IS NULL AND berthing_status = 'A' AND deleted = 'N';
- If active port programs exist for the active vessel advice, define a closure timestamp in UTC, for example '2025-10-06 00:00:00', then close and archive these port programs by running: UPDATE berth_application SET vessel_close_datetime = '2025-10-06 00:00:00', berthing_status = 'C', deleted = 'A' WHERE vessel_advice_no = '<active_vessel_advice_no>' AND vessel_close_datetime IS NULL AND berthing_status = 'A' AND deleted = 'N';
- Expire the active vessel advice by setting its effective_end_datetime to the closure timestamp '2025-10-06 00:00:00' with the query: UPDATE vessel_advice SET effective_end_datetime = '2025-10-06 00:00:00' WHERE vessel_advice_no = '<active_vessel_advice_no>' AND effective_end_datetime IS NULL;
- If no active vessel advice exists for 'MV Lion City 07', recheck the error occurrence as the duplicate vessel name error should not happen without an active advice

## L2 Team Notes
SOP execution completed successfully

## Escalation Status
- **Escalation Required:** No
