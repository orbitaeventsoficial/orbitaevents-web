import adminTestArtifacts from './adminTestArtifacts.json';

type AdminTestArtifactConfig = {
  textMarkers: readonly string[];
  prefixMarkers: readonly string[];
};

const artifactConfig = adminTestArtifacts as AdminTestArtifactConfig;

export const ADMIN_TEST_ARTIFACT_TEXT_MARKERS = artifactConfig.textMarkers;
export const ADMIN_TEST_ARTIFACT_PREFIX_MARKERS = artifactConfig.prefixMarkers;
