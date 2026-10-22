# Sources for project stories and publications

Scope: the six works on Aritra Das’s public Google Scholar profile, checked on 22 October 2026. The search stops at these six works. It does not include unpublished projects or papers belonging to authors with similar names.

## Publication inventory

| ID   | Project and authors                                                                                                                   | Public source                                                                                                                                                                          | Evidence used                                                                                                                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P001 | HomID — Aritra Das, Joseph T. Iosue, Victor V. Albert                                                                                 | [arXiv:2510.01335v2](https://arxiv.org/html/2510.01335v2)                                                                                                                              | MAIN-TEXT: Sections 4–6, especially 6.3 and 6.5–6.6. Metadata also checked on the arXiv abstract page.                                                                                                                 |
| P002 | Learning to grok — Tianyu He, Darshil Doshi, Aritra Das, Andrey Gromov                                                                | [NeurIPS 2024](https://proceedings.neurips.cc/paper_files/paper/2024/hash/17d60fef592086d1a5cb136f1946df59-Abstract-Conference.html), [full text](https://arxiv.org/html/2406.02550v2) | MAIN-TEXT: Sections 3–5, including the task-diversity comparison and transient generalization.                                                                                                                         |
| P003 | Grokking Modular Polynomials — Darshil Doshi, Tianyu He, Aritra Das, Andrey Gromov                                                    | [arXiv:2406.03495v1](https://arxiv.org/html/2406.03495v1)                                                                                                                              | MAIN-TEXT: Analytical constructions and Section 5. The learnability classification is a hypothesis, not a theorem.                                                                                                     |
| P004 | Exploring model depth and data complexity through the lens of cellular automata — Tianyu He, Darshil Doshi, Aritra Das, Andrey Gromov | [OpenReview manuscript](https://openreview.net/pdf?id=SGoI97b5KK)                                                                                                                      | ABSTRACT-ONLY for the empirical depth comparison. The indexed primary text also gives the elementary cellular automaton setup. Further PDF access met a browser challenge. No numerical performance claims were added. |
| P005 | To grok or not to grok — Darshil Doshi, Aritra Das, Tianyu He, Andrey Gromov                                                          | [arXiv:2310.13061v2](https://arxiv.org/html/2310.13061v2)                                                                                                                              | MAIN-TEXT: Section 2.1 and the pruning intervention. The story retains the controlled-task and architecture limits.                                                                                                    |
| P006 | Fractionalized holes — Aritra Das, Umberto Borla, Sergej Moroz                                                                        | [Physical Review B](https://doi.org/10.1103/PhysRevB.107.064302), [full text](https://arxiv.org/html/2111.13205v3)                                                                     | MAIN-TEXT: Sections II–IV. Distinguish isolated holes near full filling from finite-density behavior.                                                                                                                  |

## Research areas, keywords, and authors

- Geometry and intrinsic dimension: P001. Keywords: homogeneous manifolds, anisotropy, dimension estimation. Collaborators: Iosue and Albert.
- Physics of learning: P002–P005. Keywords: grokking, in-context learning, modular arithmetic, depth, cellular automata, label corruption. Collaborators: He, Doshi, and Gromov.
- Quantum matter: P006. Keywords: gauge theory, domain walls, correlated hopping, integrability. Collaborators: Borla and Moroz.

The stories describe joint work. They do not assign unverified individual contributions to a coauthor.

## Source boundaries

The [Google Scholar profile](https://scholar.google.com/citations?hl=en&user=EVtLmwcAAAAJ) was checked in the browser and fetched directly. It lists six works. `data/publications.json` keeps its titles, author strings, venues, years, and record identities. Two records have no year on the profile. The renderer supplies those years from the corresponding linked papers and marks them with an asterisk.

The HomID project uses the current paper title. Scholar still lists that work under the earlier title, “Quantum-inspired Benchmark for estimating Intrinsic Dimension.” These remain linked through the Scholar record ID. The publication list intentionally reflects the profile rather than silently replacing its metadata.

The available PaperFlows native tool list had no scholarly tools. The configured direct MCP endpoint returned HTTP 403. Public arXiv, publisher, OpenReview, and Scholar sources were used instead. This work was not performed through PaperFlows.

Queries included the Scholar profile ID, “Aritra Das Gromov grokking,” “Aritra Das Albert intrinsic dimension,” the exact modular-polynomial title, and the exact cellular-automata title. Third-party summaries were discovery aids only. They were not used as evidence for scientific findings.

## Animation boundaries

All animation design choices are INFERENCE or explanatory construction. They are not additional paper results. The modular arithmetic and cellular automaton states are computed exactly. The other animations are conceptual diagrams. Their captions say what they represent. No animation uses fabricated measured accuracy, citation counts, estimator output, or quantum time-evolution data.

The author rewrote `content/projects/homid.md` in commit `88f004c` and supplied the local PCA figure on 22 October 2026. That text is retained. The figure is copied unchanged to `assets/projects/homid/local-pca-spectra.png`; no data were extracted or recomputed. The added caption describes the visible panels, legend, and logarithmic component-index axis.

The replacement HomID animation follows the author's explicit sequence. SO(2) is embedded as rotations about the chosen north-pole axis. All points and the direction vector undergo actual rigid rotations computed with Rodrigues' formula. SO(3)/SO(2) is shown as a homogeneous space equivalent to S², not as a quotient group. The selected endpoint is an illustrative representative; the animation does not sample the benchmark or estimate a dimension.
