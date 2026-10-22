# Can a network learn the rule and memorize the mistakes?

A network that fits its training set may have learned a rule, memorized individual examples, or done both. Wrong labels make this ambiguity useful: they let us ask what the network does when the examples disagree with the rule.

## Introduce mistakes we can identify

We train neural networks on modular arithmetic tasks and replace some training labels with incorrect answers. The underlying arithmetic rule remains known, so we can evaluate rule learning separately from fitting the corrupted examples.

The networks can do both. In the studied settings, they can generalize to clean examples while also memorizing incorrect training labels. Fitting mistakes does not, by itself, show that the rule was never learned.

## Look inside, then intervene

We examine periodic structure in the learned weights to distinguish neuron populations. This gives a testable link between an internal representation and behavior.

Pruning the identified memorizing neurons reduces performance on corrupted examples and can improve performance on clean data. We also study how regularization changes this balance. The detailed interpretation is tied to the architectures and controlled tasks we analyze.

## What the animation leaves out

The animation starts with an arithmetic table, introduces wrong labels, and separates schematic rule-learning and memorizing units. It illustrates the intervention and the distinction we study. The colored units are not measured neurons, and their counts do not encode an experimental result.

The central question is more useful than a simple choice between learning and memorization: *which computations coexist, and how can we tell them apart?*

> **The takeaway**
>
> Learning a rule and memorizing exceptions can coexist. Targeted interventions help distinguish their roles.

## A few useful terms

- **Label corruption.** Replacing a training example’s target with an incorrect answer.
- **Pruning.** Removing selected units or parameters from a trained network.
- **Generalization.** Correct performance on examples excluded from training.
