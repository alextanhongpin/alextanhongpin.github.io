import { h } from 'hyperapp'

import Br from '../../atoms/Break'
import './index.css'

const page = (state, actions) => props => (
  <div class='body'>
    <div class='body-column'>
      <h1>Contact Me</h1>
      <p>I am a Developer based in Malaysia. I do Frontend, Backend and DevOps related stuff. To understand more about what I am doing at present, follow me on Github.</p>
      <p>Please email me to request for my resume.</p>
      <Br />

      <div><b>Email:</b> <a href='mailto:alextan220990@gmail.com'>alextan220990@gmail.com</a></div>
      <Br />
      <div><b>Behance:</b> <a href='https://www.behance.net/alextan220e3ae' target='_blank'>https://www.behance.net/alextan220e3ae</a></div>
      <Br />
      <div><b>Github:</b> <a href='https://github.com/alextanhongpin' target='_blank'>https://github.com/alextanhongpin</a></div>
    </div>
  </div>
)

export default page
