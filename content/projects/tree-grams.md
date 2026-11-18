# What’s in a tree?

Language has structure across many scales. How can we vary that structure and measure its effect on learning? We introduce *tree-grams*: trainable language models with separate controls for context length and capacity.

## Two controls on a language model

A conventional *n*-gram model predicts a token from the previous $n-1$ tokens. Storing every possible context becomes expensive as the window grows.

Tree-grams build the conditional distribution $p(x_n \mid x_{1:n-1})$ through a hierarchy of small tensor operations. The horizon $n$ sets the context window. The rank $d$ controls capacity. These controls let us generate different approximations of the same corpus.

## Controlled data as an experiment

We train the generators on text, then use their samples to study learning. On TinyStories and Wiki-Text, tuning narrow transformers on simpler generated data improves learning-rate transfer under maximal update parametrization (μP). 

Continued training on a new distribution also depends on the target’s entropy and correlation range. Allowing tree-grams to select among topologies produces sparse routing: up to 95% of candidate topologies can be pruned with little performance change in the tested setting.

## What the comparison tells us

Tree-grams outperform the tested traditional *n*-gram baselines and scales better than shallow transformers. A gap to deep transformers remains at longer contexts. Their purpose is to make language a *controlled experimental setting*.

## Read the animation

The schematic illustration shows what we alter - either the context or the capacity of the model at fixed context size. 

## A few useful terms

- **Horizon.** The maximal window of $n$ tokens, including the token to predict.
- **Rank.** The capacity parameter $d$ of the tree-gram.
- **Autoregressive model.** A model that generates a sequence one token at a time, conditioned on earlier tokens.

Read the [paper](https://arxiv.org/abs/2611.23093), explore the [research code](https://github.com/a-writes-code/treegram), or browse the released [models](https://huggingface.co/hugs-from-a-25/tree-gram-generators) and [datasets](https://huggingface.co/datasets/hugs-from-a-25/tree-gram-text).
