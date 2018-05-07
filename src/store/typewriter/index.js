export default {
  state: {
    heading: '',
    headingGhost: 'Hi, I am Alex.',
    subheading: '',
    subheadingGhost: 'This is my journey as a Developer.'
  },
  actions: {
    updateHeading: value => state => ({
      heading: state.heading + value
    }),
    updateSubheading: value => state => ({
      subheading: state.subheading + value
    })
  }
}
