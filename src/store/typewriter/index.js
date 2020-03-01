import { writable } from 'svelte/store'

export const state = {
  heading: writable(''),
  headingGhost: 'Hi, I am Alex.',
  subheading: writable(''),
  subheadingGhost: 'This is my journey as a Developer.'
}

const { heading, subheading } = state

export const actions = {
  updateHeading (next) {
    heading.update(prev => prev + next)
  },
  updateSubheading (next) {
    subheading.update(prev => prev + next)
  },
  clear() {
    heading.set('')
    subheading.set('')
  }
}

export default {
  state,
  actions
}
