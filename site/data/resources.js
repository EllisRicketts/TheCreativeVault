const baseResources = [
  ...digitalArtResources,
  ...aiResources,
  ...otherResources,
  ...ecosystemResources
];

const compiledResources = typeof generatedResources !== "undefined" ? generatedResources : [];

const resourceMap = new Map();

[...baseResources, ...compiledResources].forEach(resource => {
  resourceMap.set(resource.id, resource);
});

const resources = upgradeResources([...resourceMap.values()]);
