/* global wpffEntries, jQuery */
(function ($) {
  "use strict";

  $(function () {
    // Mark unread rows with a CSS class so we can bold them.
    $("#wpff-entries-table tbody tr").each(function () {
      var $status = $(this).find(".wpff-status--unread");
      if ($status.length) {
        $(this).addClass("wpff-unread");
      }
    });

    // Star toggle — AJAX, no page reload.
    $(document).on("click", ".wpff-star", function (e) {
      e.preventDefault();

      var $btn = $(this);
      var entryId = parseInt($btn.data("entry-id"), 10);
      var starred = parseInt($btn.data("starred"), 10) === 1;
      var newVal = starred ? 0 : 1;

      // Optimistic UI update.
      $btn
        .data("starred", newVal)
        .toggleClass("wpff-star--on", newVal === 1)
        .attr(
          "title",
          newVal === 1 ? wpffEntries.unstarLabel : wpffEntries.starLabel,
        );

      $.post(wpffEntries.ajaxUrl, {
        action: "wpff_toggle_star",
        nonce: wpffEntries.nonce,
        entry_id: entryId,
        starred: newVal,
      }).fail(function () {
        // Revert on failure.
        $btn
          .data("starred", starred ? 1 : 0)
          .toggleClass("wpff-star--on", starred)
          .attr(
            "title",
            starred ? wpffEntries.unstarLabel : wpffEntries.starLabel,
          );
      });
    });
  });
})(jQuery);
