import { h } from 'hyperapp'

import './index.css'

const page = (state, actions) => props => (
  <div class='body'>
    <div class='body-column'>
      <h1>Programming</h1>
      <p>Joy is when you write code for yourself - alextanhongpin</p>

      <section class='col-10'>
        <h3>Digital Piano</h3>
        <iframe class='iframe' src='/programming/p00_piano.html' />
      </section>

      <section class='col-10'>
        <h3>Calculator</h3>
        <iframe class='iframe' src='/programming/p01_calculator.html' />
      </section>

      <section class='col-10'>
        <h3>Analog Clock</h3>
        <iframe class='iframe' src='/programming/p02_clock.html' />
      </section>

      <section class='col-10'>
        <h3>Binary Clock</h3>
        <iframe class='iframe' src='/programming/p03_binary%20clock.html' />
      </section>

      <section class='col-10'>
        <h3>Malaysia Flag</h3>
        <iframe class='iframe' src='/programming/p06_flag_of_malaysia.html' />
      </section>

      <section class='col-10'>
        <h3>Image Magnifier</h3>
        <iframe class='iframe' src='/programming/p05_magnifier%20macro.html' />
      </section>

      <section class='col-10'>
        <h3>Brownian Movement</h3>
        <iframe class='iframe' src='/programming/p07_box2d%20bouncing%20ball.html' />
      </section>

      <section class='col-10'>
        <h3>Matrix</h3>
        <iframe class='iframe' src='/programming/p08_matrix.html' />
      </section>

      <section class='col-10'>
        <h3>3D Cube</h3>
        <iframe class='iframe' src='/programming/p13_cube3d.html' />
      </section>
    </div>
  </div>
)

export default page
