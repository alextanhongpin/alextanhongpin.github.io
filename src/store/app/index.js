export const state = {
  header: 'alextanhongpin',
  username: 'Alex Tan',
  footer: `Copyright © ${new Date().getFullYear()} alextanhongpin`,
  profileImg: '/assets/img/profile.jpg',
  links: [
    {
      to: '/',
      label: 'Home'
    },
    {
      to: '/contacts',
      label: 'Contact'
    },
    {
      to: '/photos',
      label: 'Photo'
    },
    {
      to: '/books',
      label: 'Book'
    },
    {
      to: '/songs',
      label: 'Guitar'
    },
    {
      to: '/codes',
      label: 'Code'
    }
  ]
}

export default { state }
