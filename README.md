# CANopen EDS Editor
A browser-based CANopen Electronic Data Sheet editor.

Live Demo: https://www.ebrent.net/canopen

## Installation
1. `git clone https://github.com/bggardner/canopen-eds-editor.git`
2. Open `canopen-eds-editor/eds.html` in your web browser.
3. An internet connection is required to access the [INI parser](https://github.com/shangerxin/config-ini), but this can be downloaded separately if necessary.

## Usage
* There are four sections (File Info, Device Info, Other, Object Dictionary), each expandable/collapsible by clicking on their title.
* Complete the forms in each section as appropriate and/or load and existing EDS by clicking the `Load` button.
* Some fields can be auto-populated to ensure data integrity.
* New objects can be added by using the form at the bottom of the Object Dictonary section:
    1. Enter the index in hexadecimal.
    2. Enter the name, and select an object type (and category if a communication parameter <`0x2000` or >`0x5FFF`).
    3. Enter/select remaining fields and click the `✚` button.
    4. If a complex object, sub-indices may be added by changing the Default Value of sub-index 0x00.
        1. If `CompactSubObj` is used, parameter names can still be provided.  Blank names will be removed from the saved EDS.
* Objects and sub-indices may be removed by clicking the `✖` button.
* Click the `Save` button to download the modified EDS.

## Notes
* Rules follow CiA 306
* Semi-colon delimited (line) comments are not loaded/saved.
* `CompactPDO`s are not supported
* Many DCF keynames are not supported
* Some error checking is performed, but most values are loaded/saved as written
