# Home Page Components

This directory contains modular components for the home page (`pages/index.js`), making the code more maintainable and easier to understand.

## Component Structure

### Main Components

1. **Header.jsx**
   - Displays the page title and "Add New Docs" link
   - Self-contained with no props needed

2. **Footer.jsx**
   - Shows attribution and links
   - Self-contained with no props needed

3. **ErrorDisplay.jsx**
   - Displays error messages in a styled card
   - Props: `error` (string)

4. **SearchCard.jsx**
   - Complete search form with query input, source filter, and max results
   - Props: `query`, `setQuery`, `maxResults`, `setMaxResults`, `selectedSource`, `setSelectedSource`, `loading`, `handleSearch`, `handleKeyPress`, `indexInfo`

5. **SearchResults.jsx**
   - Displays search results or empty state
   - Uses `SearchResultItem` component
   - Props: `searchResults`, `selectedSource`, `indexInfo`

6. **DeleteConfirmDialog.jsx**
   - Modal dialog for confirming source deletion
   - Includes body scroll lock when open
   - Props: `isOpen`, `sourceToDelete`, `deleting`, `chunksCount`, `onConfirm`, `onCancel`

7. **IndexInfoCard.jsx**
   - Shows overall statistics and list of indexed sources
   - Uses `SourceItem` component
   - Props: `indexInfo`, `expandedSources`, `sourcePages`, `loadingPages`, `pageNumbers`, `onToggleSourceExpansion`, `onDeleteSource`, `onSetCurrentPage`

### Sub-Components

8. **SearchResultItem.jsx**
   - Individual search result with copy functionality
   - Used by `SearchResults`
   - Props: `result`, `index`, `totalSources`

9. **SourceItem.jsx**
   - Individual source with expandable pages list
   - Includes pagination for pages
   - Uses `PageItem` component
   - Props: `source`, `onDelete`, `onToggleExpansion`, `isExpanded`, `pages`, `loadingPages`, `currentPage`, `setCurrentPage`

10. **PageItem.jsx**
    - Individual page with expandable chunks
    - Shows page details and chunk content
    - Props: `page`, `sourceName`

## Benefits of This Structure

✅ **Reduced File Size**: `index.js` reduced from 935 lines to ~270 lines (71% reduction)

✅ **Better Organization**: Each component has a single responsibility

✅ **Reusability**: Components can be easily reused in other pages

✅ **Easier Testing**: Individual components can be tested in isolation

✅ **Better Maintainability**: Changes to specific features only affect relevant component files

✅ **Cleaner Code**: Logic is separated from presentation

## Component Hierarchy

```
index.js (Main Page)
├── Header
├── IndexInfoCard
│   └── SourceItem (multiple)
│       └── PageItem (multiple)
├── SearchCard
├── ErrorDisplay
├── SearchResults
│   └── SearchResultItem (multiple)
├── DeleteConfirmDialog
└── Footer
```

