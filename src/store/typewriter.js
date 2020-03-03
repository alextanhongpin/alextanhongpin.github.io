import { writable } from 'svelte/store'

export default {
  heading: writable(''),
  headingGhost: 'Hi, I am Alex.',
  subheading: writable(''),
  subheadingGhost: 'This is my journey as a Developer.',
}
