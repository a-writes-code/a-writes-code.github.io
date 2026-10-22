# Why are some arithmetic rules easier to learn than others?

Knowing that a neural network can represent a function does not tell us whether training will find it. Modular arithmetic gives us a small setting in which to make this distinction precise.

## Start with networks we can solve

We construct analytical weights for modular multiplication and for addition with multiple terms. These are explicit solutions: the network’s computation can be checked directly.

We then compare these solutions with representations learned by trained networks. In the tasks we study, training can produce similar periodic structure when the networks generalize.

## Composition makes the distinction visible

By combining these *expert* computations, we can construct networks that evaluate arbitrary modular polynomials, given sufficient width. This establishes representational capability for the constructed architecture.

It does not mean that standard training reliably discovers every such solution. We propose a learnability classification and test it on several polynomial tasks. The classification is supported by experiments; a general proof remains open.

## A circuit you can follow

The animation evaluates xy³ + x²y modulo seven. Two arithmetic branches feed an addition step. For x = 3 and y = 2, the branches give 3 and 4 modulo seven, so the final result is 0. Each number is computed exactly. This is a schematic of composing arithmetic operations, rather than a drawing of the full analytical neural network.

The broader lesson is that *a solution exists* and *training finds a solution* are different statements. Controlled tasks let us ask what lies between them.

> **The takeaway**
>
> Representation and learnability are different questions. Constructing a solution helps expose the gap.

## A few useful terms

- **Grokking.** Delayed generalization after a model has already fit its training examples.
- **Analytical weights.** Network parameters specified by a mathematical construction.
- **Modular polynomial.** A polynomial whose output is reduced modulo a fixed integer.
