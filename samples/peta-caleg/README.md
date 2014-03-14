## Components

1. Title
2. Lembaga navigation
3. Map with selectable regions
4. Breadcrumb nav
5. Data listing / detail views:
  * Provinsi
  * Dapil
  * Partai
  * Caleg

## Interactions

* Select a lembaga:
  1. URL: `#{lembaga}`
  2. Map and list update to show lembaga-specific regions
    * load these from the geographic API
    * figure out how to do fat finger regions later
  3. Update breadcrumb nav:
    * `DPD > provinsi`
    * `DPR > dapil`
    * `DPRDI > dapil`

* Select a region:
  1. URLs:
    * `#DPD/provinsi/{provinsi}`
    * `#DPR/dapil/{dapil}`
    * `#DPRDI/dapil/{dapil}`
  2. Map zooms to the selected region
  3. Update breadcrumb nav:
    * `DPD > provinsi > {provinsi}`
    * `DPR > provinsi > {provinsi} > dapil > {dapil}`
    * `DPRDI > provinsi > {provinsi} > dapil > {dapil}`
    * *Note: not 100% sure we want to include provinsi layer in DPR & DPRDI*
  4. Replace list with region-specific data
    * DPD provinsi list the *caleg* for that provinsi
    * DPR & DPRDI: list the *partai* for that dapil

* Select a DPD caleg:
  1. URL: `#DPD/provinsi/{provinsi}/caleg/{caleg}`
  2. Replace list with caleg info
  3. Map minifies?

* Select a DPR or DPRDI partai:
  1. URL: `#{lembaga}/dapil/{dapil}/partai/{partai}`
  2. Replace list with caleg for that dapil + partai
  3. Map minifies?

* Select a DPR or DPRDI caleg:
  1. URL: `#{lembaga}/dapil/{dapil}/partai/{partai}/caleg/{caleg}`
  2. Replace list with caleg info
  3. Map minifies?

## Mobile considerations
The map should play a much bigger role on desktop than mobile, but it would be
nice to make it available on mobile. Tomas and I discussed having it take up a
fairly narrow strip of vertical space in the layout (between the lembaga nav
and the breadcrumb), and making it possible to hide it by scrolling down. We
also discussed providing the option of maximizing it - making it take up more
of the screen and become the primary interface.

## Other ideas
On desktop, listings could flow horizontally to fill the area below the map,
rather than stacking vertically (as on mobile). We shouldn't need to do a
masonry layout because the items should be the same size. Selecting an item
(namely a candidate, which is the only level of navigation without any
additional listings underneath it) would then "pop" the item up in a non-modal
way, giving it more space to show the additional data without reflowing the
content around it.
