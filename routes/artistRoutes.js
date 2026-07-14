const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const ctrl = require("../controllers/artistController");
const linkCtrl = require("../controllers/artistMusicianLinkController");

const router = express.Router();

router.get("/", asyncHandler(ctrl.list));

// ART-012B Discogs artist search/detail support. Specific routes before /:id
router.get("/discogs/config", asyncHandler(ctrl.getDiscogsConfigStatus));
router.get("/discogs/:discogsArtistId", asyncHandler(ctrl.getDiscogsArtistDetail));

// ART-015B read-only duplicate/merge support. Specific routes before /:id
router.get("/merge/impact", asyncHandler(ctrl.getMergeImpact));
router.get("/merge/history", asyncHandler(ctrl.getMergeHistory));
router.post("/merge/execute", asyncHandler(ctrl.executeMerge));
router.get("/duplicate-candidates", asyncHandler(ctrl.listDuplicateReviewCandidates));
router.patch("/duplicate-candidates/:candidateId/status", asyncHandler(ctrl.updateDuplicateCandidateStatus));

// Specific routes before /:id
router.get("/:id/relations", asyncHandler(ctrl.getRelations));
router.get("/:id/discogs/search", asyncHandler(ctrl.searchDiscogsForArtist));
router.post("/:id/discogs/link", asyncHandler(ctrl.linkDiscogsArtist));
router.get("/:id/discogs/images", asyncHandler(ctrl.getDiscogsImages));
router.post("/:id/discogs/images/:imageId/primary", asyncHandler(ctrl.setPrimaryDiscogsImage));
router.get("/:id/discogs/enrichment-proposals", asyncHandler(ctrl.getDiscogsEnrichmentProposals));
router.post("/:id/discogs/enrichment-proposals/generate", asyncHandler(ctrl.generateDiscogsEnrichmentProposals));
router.patch("/:id/discogs/enrichment-proposals/:proposalId/status", asyncHandler(ctrl.updateDiscogsEnrichmentProposalStatus));
router.post("/:id/discogs/enrichment-proposals/:proposalId/apply", asyncHandler(ctrl.applyDiscogsEnrichmentProposal));
router.get("/:id/discogs/name-proposals", asyncHandler(ctrl.listDiscogsNameProposals));
router.post("/:id/discogs/name-proposals/generate", asyncHandler(ctrl.generateDiscogsNameProposals));
router.patch("/:id/discogs/name-proposals/:proposalId/status", asyncHandler(ctrl.updateDiscogsNameProposalStatus));
router.post("/:id/discogs/name-proposals/:proposalId/apply-spelling", asyncHandler(ctrl.applyDiscogsNameProposalAsSpelling));
router.get("/:id/discogs/spelling-proposals", asyncHandler(ctrl.getDiscogsSpellingProposals));
router.post("/:id/discogs/spelling-proposals/alternative", asyncHandler(ctrl.addDiscogsAlternativeSpelling));
router.post("/:id/discogs/spelling-proposals/canonical-preview", asyncHandler(ctrl.getDiscogsCanonicalRenamePreview));
router.post("/:id/discogs/spelling-proposals/canonical", asyncHandler(ctrl.executeDiscogsCanonicalRename));
router.get("/:id/duplicate-candidates", asyncHandler(ctrl.findDuplicateCandidates));
router.patch("/:id/favorite", asyncHandler(ctrl.setFavorite));
router.post("/:artistKey/musician/link", asyncHandler(linkCtrl.link));
router.delete("/:artistKey/musician/link", asyncHandler(linkCtrl.unlink));
router.post("/:id/restore", asyncHandler(ctrl.restore));
router.delete("/:id/hard", asyncHandler(ctrl.hardDelete));

router.get("/:id", asyncHandler(ctrl.get));
router.post("/", asyncHandler(ctrl.create));
router.put("/:id", asyncHandler(ctrl.update));

// Soft delete last so it does not swallow /:id/hard
router.delete("/:id", asyncHandler(ctrl.remove));

module.exports = router;
