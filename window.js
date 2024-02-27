/*

API
-- file:new  create new file/directory from template
-- file:open  open existing directory
-- file:save  save updates to uncontrolled file
-- file:close  exit window
-- edit:mitose  make new uncontrolled file from chosen file
-- edit:publish  publish chosen uncontrolled file
-- edit:upload  (automatically) upload external files to working directory

window.preload.js
-- file:save  upload external files, push JSON changes
-- edit:publish  shift external files, publish unctrolled to controlled
-- edit:upload  get list, foreach: upload into UNCONTROLLED.n/ dir

index.js
-> file:new
-> file:open
-> 

how editing and viewing files works:

template directory structure:
DOCUMENT
  2023-12-29.1.html
  2023-12-29.1/
    image.png
  2023-12-29.2.html
  UNCONTROLLED.1.html
  UNCONTROLLED.1/
    image.png

be sure to include guide to navigating documents

how reading revisions works:
  only uncontrolled documents can be edited and saved to
  documents viewed through an iframe
  documents (superficially) edited through iframe postmessage queries
  documents pushed updates by creating entirely new file and overwriting the old

how editing and creation works:
  best case is wysiwyg
  how to create something that works naturally and smoothly, where editing can happen quickly and without excess effort
  typing and keybinds

  elements, flow

  type section name
  type subsection name
  enter to create element under
  arrow up and arrow down to navigate element under edit

  editor treats everything as individual lines, for natural navigation

  thirds of screen: mgui, edit, view
  mgui shows all active keybinds, edit shows line under edit and all aspects of it, view highlights current element and navigates with edit movements

  editing Section and Subsection:
  text line input element

  editing Step:
  text instruction input and its gallery
  up and down to navigate to next, previous, enter to create new under, exit blank autodeletes

  Section
  Subsection
  Step
    isntruction line
      tooltip
      image, gif, video, link, table

temporary next steps:
-- make the window template (mgui, edit, view)
-- make mgui calls: view-only, edit-only, filenew, fileopen
-- make functional filenew and fileopen
-- make functional viewing created files
-- make functional creating new edit file
-- make functional editing edit files (full functionality)

*/
