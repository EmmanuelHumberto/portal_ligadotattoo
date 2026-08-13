# AR-25 Test Matrix

## Public catalog
- list product pagination
- filter by type
- filter by manufacturer
- product 404
- product detail contains canonical facts
- product detail excludes unreviewed claims

## Media
- UNKNOWN rights not public
- PENDING rights not public
- PERMITTED media public
- RESTRICTED/EXPIRED/TAKEDOWN not public
- optimistic rights update conflict

## Search
- product projection insert
- product projection update
- product deletion removes projection
- prefix suggestions
- empty query
- cursor paging

## Commerce
- latest observation per listing
- offers sorted by price
- observation timestamp returned
- price history window
- percentage change
- insufficient history returns null trend

## Security
- public endpoints work without bearer token
- media admin endpoints require authentication
- media admin endpoints require `media.review`
