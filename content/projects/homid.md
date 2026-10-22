# How many dimensions does a dataset really have?

A surface can sit in three dimensions while needing only two coordinates to describe a point. The same distinction appears in machine learning: the number of recorded features need not equal the number of independent variables in the data.

## A benchmark with a known answer

This smaller number is the *intrinsic dimension*. Estimating it from samples is difficult. On realistic data, there is usually no exact answer against which to check an estimate.

With my collaborators, I developed HomID. It uses families of homogeneous spaces, including Stiefel, Grassmann, and flag manifolds. Their dimensions are known. This lets us compare an estimator’s answer with the ground truth.

## Geometry is part of the test

We compare estimators across these spaces and apply controlled distortions and noise. The aim is to test how the embedding and local geometry affect dimension estimates.

The experiments reveal substantial differences between methods. They also show why success on familiar, nearly isotropic benchmarks can be misleading. Local anisotropy is a useful stressor, but our evidence does not establish it as the sole cause of estimation error.

## What the animation shows

The animation stretches a simple two-dimensional surface. Its shape in the surrounding space changes, while its intrinsic dimension stays fixed. This is a conceptual example of the distinction the benchmark studies. It is not a HomID sample or an estimator-performance plot.

> **The takeaway**
>
> A reliable dimension estimator must handle changes in geometry, not just recover the dimension of a sphere.

## A few useful terms

- **Intrinsic dimension.** The number of independent local coordinates needed to describe a manifold.
- **Manifold.** A space that locally resembles ordinary Euclidean space.
- **Anisotropy.** Dependence of a geometric property on direction.
